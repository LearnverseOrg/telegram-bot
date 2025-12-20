import mongoose from "mongoose";

const msgSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TelegramUser",
      required: true,
      index: true,
    },
    messageId: {
      type: Number,
      required: true,
    },
    chatId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["text", "callback_query", "command", "photo", "other"],
      default: "text",
    },
    // Meta info
    originalMessage: {
      type: mongoose.Schema.Types.Mixed, // Store some raw data if needed
    },
  },
  { timestamps: true }
);

const Msg = mongoose.model("TelegramMsg", msgSchema);

export default Msg;
