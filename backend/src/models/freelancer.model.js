const mongoose = require("mongoose");

const freelancerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    linkedin: {
      type: String,
    },

    state: {
      type: String,
    },

    city: {
      type: String,
    },

    pincode: {
      type: String,
    },

    category: {
      type: String,
      enum: [
        "Professional",
        "Cultural",
        "Private"
      ],
    },
  },
  {
    timestamps: true,
  }
);

const freelancerModel = mongoose.model("freelancers", freelancerSchema);

module.exports = freelancerModel;