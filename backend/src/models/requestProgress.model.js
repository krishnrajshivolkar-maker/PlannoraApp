
const mongoose = require("mongoose");

const requestProgressSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "requests",
            required: true,
            unique: true,
        },

        accepted: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "freelancers",
            },
        ],

        sent: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "freelancers",
            },
        ],

        rejected: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "freelancers",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const requestProgressModel = mongoose.model(
    "requestprogress",
    requestProgressSchema
);

module.exports = requestProgressModel;
