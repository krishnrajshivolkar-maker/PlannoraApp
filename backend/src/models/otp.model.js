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

    /*
        Pending registration data.

        The permanent user account is created
        only after the OTP is successfully verified.
    */

    username: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    attempts: {
        type: Number,
        default: 0
    },

    // TTL: pending registrations that are never verified would otherwise be
    // kept (including the pending password hash) forever.
    createdAt: {
        type: Date,
        expires: 600
    }

}, {
    timestamps: true
});


const otpmodel = mongoose.model(
    "otp",
    otpSchema
);


module.exports = otpmodel;