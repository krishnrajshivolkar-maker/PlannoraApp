const mongoose = require("mongoose");

const freelancerDetailsSchema = new mongoose.Schema(
    {
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "freelancers",
            required: true,
            unique: true,
        },

        category: {
            type: String,
            enum: ["Professional", "Cultural", "Private"],
            required: true,
        },

        state: {
            type: String,
            trim: true,
        },

        city: {
            type: String,
            trim: true,
        },

        pincode: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

freelancerDetailsSchema.index({
    category: 1,
    state: 1,
    city: 1,
    pincode: 1,
});

const freelancerDetailModel = mongoose.model("freelancerdetails",freelancerDetailsSchema);

module.exports = freelancerDetailModel;