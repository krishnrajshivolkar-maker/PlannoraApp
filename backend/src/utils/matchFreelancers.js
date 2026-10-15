const mongoose = require("mongoose");

const requestModel = require("../models/request.model");
const freelancerDetailModel = require("../models/freelancerDetails.model");
const requestProgressModel = require("../models/requestProgress.model");
const freelancerProgressModel = require("../models/freelancerProgress.model");
const { getAcceptDeadline, getEventEnd } = require("../utils/requestRules");

const CATEGORIES = ["Professional", "Cultural", "Private"];

function clean(value) {
    return value === undefined || value === null ? "" : String(value).trim();
}

// location comparison key: trimmed + case-folded, used on BOTH sides
function locKey(value) {
    return clean(value).toLowerCase();
}

function idString(id) {
    return id === undefined || id === null ? "" : id.toString();
}

function parseCount(value, message) {
    const n = typeof value === "string" ? Number(value.trim() || NaN) : value;

    if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
        throw new Error(message);
    }

    return n;
}

/*
    Pure ordering logic (no DB). Profiles are freelancerdetails documents.
    Tiers: 1 same city+state, 2 same city/different state,
    3 same state/different city (pincode matches first), 4 different state.
    A profile missing a field that a tier needs to compare is skipped.
    `limit` can be Infinity: location only decides ORDER, not who is included.
*/
function rankCandidates(profiles, location, excluded, limit) {
    const city = locKey(location.city);
    const state = locKey(location.state);
    const pincode = clean(location.pincode);

    const t1 = [];
    const t2 = [];
    const t3Pin = [];
    const t3Other = [];
    const t4 = [];
    const seen = new Set();

    for (const profile of profiles) {
        const id = idString(profile && profile.freelancerId);

        if (!id || seen.has(id) || excluded.has(id)) continue;

        const pState = locKey(profile.state);
        const pCity = locKey(profile.city);

        if (!pState) continue;

        if (pState !== state) {
            // same city name in another state ranks above any other state
            (pCity && pCity === city ? t2 : t4).push(profile.freelancerId);
        } else if (!pCity) {
            continue;
        } else if (pCity === city) {
            t1.push(profile.freelancerId);
        } else if (pincode && clean(profile.pincode) === pincode) {
            t3Pin.push(profile.freelancerId);
        } else {
            t3Other.push(profile.freelancerId);
        }

        seen.add(id);
    }

    return [...t1, ...t2, ...t3Pin, ...t3Other, ...t4].slice(0, limit);
}

// ordered list of ALL eligible freelancer ids (freelancers._id) in the request's category
async function matchFreelancersForRequest(request) {
    try {
        if (!request) throw new Error("Request is required");

        const requestId = request._id;
        const category = clean(request.category);
        const city = clean(request.city);
        const state = clean(request.state);

        if (!requestId || !city || !state || !category) {
            throw new Error("Missing required request fields");
        }

        if (!CATEGORIES.includes(category)) {
            throw new Error("Invalid request category");
        }

        const progress = await requestProgressModel.findOne({ requestId }).lean();

        const excluded = new Set(
            [
                ...(progress?.sent || []),
                ...(progress?.accepted || []),
                ...(progress?.rejected || []),
            ].map(idString)
        );

        const profiles = await freelancerDetailModel
            .find({ category })
            .select("freelancerId city state pincode")
            .sort({ _id: 1 })
            .lean();

        return rankCandidates(
            profiles,
            { city, state, pincode: request.pincode },
            excluded,
            Infinity
        );
    } catch (error) {
        console.error("matchFreelancersForRequest: Error matching freelancers", error);
        throw error;
    }
}

async function bulkRecordReceived(freelancerIds, requestId) {
    const ops = freelancerIds.map((id) => ({
        updateOne: {
            filter: { freelancerId: id },
            update: { $addToSet: { received: requestId } },
            upsert: true,
            setDefaultsOnInsert: true,
        },
    }));

    try {
        await freelancerProgressModel.bulkWrite(ops, { ordered: false });
    } catch (error) {
        // concurrent upserts can race on the unique index; the retry is a plain update
        if (error && (error.code === 11000 || error.writeErrors)) {
            await freelancerProgressModel.bulkWrite(ops, { ordered: false });
            return;
        }

        throw error;
    }
}

/*
    Sends the request to EVERY eligible freelancer at once (no candidate cap).
    Call this right after the request is created.
    Records on both sides: requestprogress.sent and freelancerprogress.received.
    Safe to call again: already sent / accepted / rejected freelancers are skipped.
*/
async function sendRequestToAllFreelancers(requestId) {
    try {
        if (!requestId || !mongoose.isValidObjectId(requestId)) {
            throw new Error("Invalid request ID");
        }

        const request = await requestModel
            .findById(requestId)
            .select("category city state pincode start_time date end_time no_of_candidates")
            .lean();

        if (!request) throw new Error("Request not found");

        const now = new Date();
        const end = getEventEnd(request);

        if (end && end <= now) {
            return { sent: [], message: "Request has already ended" };
        }

        const deadline = getAcceptDeadline(request);

        if (deadline && deadline <= now) {
            return {
                sent: [],
                message: "Acceptance window already closed for this event date, nothing sent",
            };
        }

        const ids = await matchFreelancersForRequest(request);

        // make sure the progress document exists (idempotent)
        try {
            await requestProgressModel.updateOne(
                { requestId },
                { $setOnInsert: { sent: [], accepted: [], rejected: [] } },
                { upsert: true }
            );
        } catch (error) {
            if (!error || error.code !== 11000) throw error;
        }

        if (!ids.length) {
            return { sent: [], message: "No eligible freelancers found" };
        }

        await requestProgressModel.updateOne(
            { requestId },
            { $addToSet: { sent: { $each: ids } } }
        );

        try {
            await bulkRecordReceived(ids, requestId);
        } catch (error) {
            // keep both sides consistent: undo, then report the failure
            await requestProgressModel
                .updateOne({ requestId }, { $pull: { sent: { $in: ids } } })
                .catch((rollbackError) =>
                    console.error("sendRequestToAllFreelancers: rollback failed", rollbackError)
                );

            throw error;
        }

        return {
            sent: ids,
            message: "Request recorded for all matching freelancers (no notification is sent by this function)",
        };
    } catch (error) {
        console.error("sendRequestToAllFreelancers: Error sending request", error);
        throw error;
    }
}

// records a batch on both progress documents; safe to retry and to run concurrently
// (kept for backwards compatibility; sendRequestToAllFreelancers replaces it for the main flow)
async function sendBatchToFreelancers(requestId, candidateQueue, batchSize, startIndex = 0) {
    try {
        if (!requestId || !mongoose.isValidObjectId(requestId) || !Array.isArray(candidateQueue)) {
            throw new Error("Invalid request ID or candidate queue");
        }

        const size = parseCount(batchSize, "Invalid batch size or start index");
        const start = Number(startIndex);

        if (!Number.isInteger(start) || start < 0) {
            throw new Error("Invalid batch size or start index");
        }

        const request = await requestModel
            .findById(requestId)
            .select("end_time no_of_candidates")
            .lean();

        if (!request) {
            throw new Error("Request not found");
        }

        if (request.end_time && new Date(request.end_time) <= new Date()) {
            return { sent: [], nextQueueStart: start, message: "Request has already ended" };
        }

        try {
            await requestProgressModel.updateOne(
                { requestId },
                { $setOnInsert: { sent: [], accepted: [], rejected: [] } },
                { upsert: true }
            );
        } catch (error) {
            if (!error || error.code !== 11000) throw error;
        }

        const progress = await requestProgressModel.findOne({ requestId }).lean();

        if ((progress?.accepted || []).length >= request.no_of_candidates) {
            return { sent: [], nextQueueStart: start, message: "Required freelancers already accepted" };
        }

        const sent = [];
        const seen = new Set();
        let next = start;

        for (let i = start; i < candidateQueue.length && sent.length < size; i++) {
            next = i + 1;

            const id = candidateQueue[i];
            const key = idString(id);

            if (!key || seen.has(key)) continue;
            seen.add(key);

            const claim = await requestProgressModel.updateOne(
                {
                    requestId,
                    sent: { $ne: id },
                    accepted: { $ne: id },
                    rejected: { $ne: id },
                },
                { $addToSet: { sent: id } }
            );

            if (claim.modifiedCount !== 1) continue;

            try {
                await bulkRecordReceived([id], requestId);
            } catch (error) {
                await requestProgressModel
                    .updateOne({ requestId }, { $pull: { sent: id } })
                    .catch((rollbackError) =>
                        console.error("sendBatchToFreelancers: rollback failed", rollbackError)
                    );

                throw error;
            }

            sent.push(id);
        }

        return {
            sent,
            nextQueueStart: next,
            message: sent.length
                ? "Batch recorded (no notification is sent by this function)"
                : "No eligible freelancers remaining",
        };
    } catch (error) {
        console.error("sendBatchToFreelancers: Error sending batch", error);
        throw error;
    }
}

module.exports = {
    matchFreelancersForRequest,
    sendRequestToAllFreelancers,
    sendBatchToFreelancers,
    rankCandidates,
};