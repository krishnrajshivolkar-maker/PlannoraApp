const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
    {
        // Reference to the request
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "requests",
            required: true
        },

        // Reference to the freelancer who tried to accept
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "freelancers",
            required: true
        },

        // When they tried to accept (for sorting by order)
        attemptedAt: {
            type: Date,
            default: Date.now
        },

        // Whether they've been notified about an available slot
        notified: {
            type: Boolean,
            default: false
        },

        // When they were notified
        notifiedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Ensure unique combination of requestId and freelancerId
waitlistSchema.index({ requestId: 1, freelancerId: 1 }, { unique: true });

// Index for querying waitlist by request
waitlistSchema.index({ requestId: 1, attemptedAt: 1 });

const waitlistModel = mongoose.model("waitlist", waitlistSchema);

module.exports = waitlistModel;
