const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customers",
            required: true
        },

        event_details: {
            type: String,
            required: true,
            trim: true
        },

        pay: {
            type: Number,
            required: true,
            min: 0
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            enum: [
                "Professional",
                "Cultural",
                "Private"
            ],
            required: true
        },

        time: {
            type: String,
            required: true
        },

        start_time: {
            type: Date,
            required: true
        },

        // Indexed: the expiry worker queries this field every minute.
        end_time: {
            type: Date,
            required: true,
            index: true
        },

        // Set once the expiry worker has processed this request, so the same
        // finished request is not rescanned on every tick forever.
        expiry_handled: {
            type: Boolean,
            default: false
        },

        no_of_candidates: {
            type: Number,
            required: true,
            min: 1
        },

        date: {
            type: Date,
            required: true
        },

        additional_description: {
            type: String,
            default: "",
            trim: true
        },

        completion_code_hash: {
            type: String,
            required: true
        },

        attendance_code: {
            type: String,
            default: null,
            select: false
        },

        // Auto-rejected freelancers after deadline
        auto_rejected: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "freelancers"
            }
        ],

        // Freelancers removed by customer from accepted list
        manually_rejected: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "freelancers"
            }
        ],

        // Tracks if deadline auto-rejection has been processed
        deadline_rejection_processed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const requestModel = mongoose.model(
    "requests",
    requestSchema
);

module.exports = requestModel;