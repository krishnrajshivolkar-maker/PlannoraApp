
const mongoose = require("mongoose");

const freelancerProgressSchema = new mongoose.Schema(
    {
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "freelancers",
            required: true,
            unique: true,
        },

        received: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "requests",
            },
        ],

        accepted: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "requests",
            },
        ],

        attended: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "requests",
            },
        ],

        rejected: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "requests",
            },
        ],

        redflag: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "requests",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const freelancerProgressModel = mongoose.model(
    "freelancerprogress",
    freelancerProgressSchema
);

module.exports = freelancerProgressModel;
