const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        // lookups happen on every verification request
        index: true
    },

    otp: {
        type: String,
        required: true
    },

    attempts: {
        type: Number,
        default: 0
    },

    // TTL: abandoned password reset OTPs must not be kept forever.
    createdAt: {
        type: Date,
        expires: 600
    }

}, {
    timestamps: true
});


const forgototp = mongoose.model(
    "forgototp",
    otpSchema
);

module.exports = forgototp;