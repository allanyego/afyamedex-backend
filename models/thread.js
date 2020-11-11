const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null,
      lowercase: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Thread", threadSchema);
