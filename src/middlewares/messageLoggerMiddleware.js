import Msg from "../models/msg-model.js";
import logger from "../helpers/logger.js";

export const messageLoggerMiddleware = async (ctx, next) => {
  // Only log messages from PRIVATE chats, never from groups
  const isPrivateChat = ctx.chat?.type === "private";
  const mongoUserId = ctx.state.user?._id;
  const chatId = ctx.chat?.id ? String(ctx.chat.id) : null;

  // 1. Log Incoming User Action (Only from private chats)
  try {
    if (isPrivateChat && mongoUserId && chatId) {
      if (ctx.message) {
        // Standard User Message
        const content =
          ctx.message.text || ctx.message.caption || "[Non-text message]";
        const type = ctx.message.text
          ? ctx.message.text.startsWith("/")
            ? "command"
            : "text"
          : "other";

        await Msg.create({
          userId: mongoUserId,
          messageId: ctx.message.message_id,
          chatId,
          content,
          isBot: false,
          type,
          originalMessage: ctx.message,
        });
      }
      // Note: We are explicitly skipping ctx.callbackQuery logging here as requested
      // "handle callbacks clearly and like no need to lock them"
    }
  } catch (err) {
    logger.error("Error logging incoming message:", err);
  }

  // 2. Wrap Bot Response Methods to Log Outgoing (Only for private chats)
  const originalReply = ctx.reply.bind(ctx);
  const originalEditMessageText = ctx.editMessageText.bind(ctx);

  ctx.reply = async (...args) => {
    try {
      const message = await originalReply(...args);
      // content is arg[0] usually
      const content =
        typeof args[0] === "string" ? args[0] : "[Non-text reply]";

      // Log Bot Message (only for private chats)
      if (message && isPrivateChat && mongoUserId) {
        try {
          await Msg.create({
            userId: mongoUserId,
            messageId: message.message_id,
            chatId: String(message.chat.id),
            content,
            isBot: true,
            type: "text",
            originalMessage: message,
          });
        } catch (logErr) {
          logger.error("Failed to log outgoing message:", logErr);
        }
      }
      return message;
    } catch (err) {
      logger.error("Error in wrapped ctx.reply:", err);
      throw err;
    }
  };

  ctx.editMessageText = async (...args) => {
    try {
      const message = await originalEditMessageText(...args);

      // Update the existing message if we tracked it (only for private chats)
      if (message && isPrivateChat && mongoUserId) {
        try {
          await Msg.findOneAndUpdate(
            { messageId: message.message_id, chatId: String(message.chat.id) },
            {
              // For a bot edit, the 'userId' field on the Msg still refers to the *User* owner of the chat context
              // which we have as mongoUserId.
              userId: mongoUserId,
              content:
                typeof args[0] === "string"
                  ? args[0]
                  : message.text || "[Edited Content]",
              isBot: true,
              originalMessage: message,
            },
            { upsert: true, new: true }
          );
        } catch (logErr) {
          logger.error("Failed to log edited message:", logErr);
        }
      }
      return message;
    } catch (err) {
      if (
        err.description &&
        err.description.includes("message is not modified")
      ) {
        return; // Ignore
      }
      logger.error("Error in wrapped ctx.editMessageText:", err);
      throw err;
    }
  };

  await next();
};
