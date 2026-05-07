const mongoose = require("mongoose");

const otpSessionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "otp_sessions",
  }
);

module.exports = mongoose.model("OtpSession", otpSessionSchema);
