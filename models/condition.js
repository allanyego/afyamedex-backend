const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    symptoms: {
      type: String,
      required: true,
    },
    remedies: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    media: {
      kind: {
        type: String,
        enum: [null, "video", "image"],
        default: null,
      },
      file: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Condition", conditionSchema);
