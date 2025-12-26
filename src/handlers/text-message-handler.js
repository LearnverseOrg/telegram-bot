import { detectStudyMaterialQuery } from "../services/gemini-service.js";
import { BOT_USERNAME, LEARNVERSE_BASE_URL } from "../config/config.js";
import {
  isAiQueryDetectionEnabled,
  isGroupChatRepliesEnabled,
} from "../services/config-service.js";
import {
  canMakeAiQuery,
  executeAiQuery,
  canRespondInChat,
  executeResponse,
} from "../services/rate-limit-service.js";
import logger from "../helpers/logger.js";

/**
 * Handles regular text messages and detects study material queries
 * @param {object} ctx - Telegraf context
 */
export async function handleTextMessage(ctx) {
  logger.info("Processing text message for query detection");
  const message = ctx.message?.text;

  // Skip if no text or if it's a command
  if (!message || message.startsWith("/")) {
    return;
  }

  const userId = ctx.from.id;
  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username || ctx.from.first_name || "there";
  const isGroupChat =
    ctx.chat.type === "group" || ctx.chat.type === "supergroup";

  logger.info(
    { userId, username, chatId, isGroupChat, message },
    "Processing text message for query detection"
  );

  try {
    // Check if AI query detection is enabled
    // Different logic for private vs group chats
    let shouldRespond = false;
    let isQuery = false;

    if (isGroupChat) {
      // GROUP CHAT: Use AI to detect if it's a study material query

      const aiDetectionEnabled = await isAiQueryDetectionEnabled();
      if (!aiDetectionEnabled) {
        logger.debug("AI query detection is disabled via feature flag");
        return;
      }

      logger.info("AI query detection is enabled");
      const groupRepliesEnabled = await isGroupChatRepliesEnabled();
      if (!groupRepliesEnabled) {
        logger.debug("Group chat replies are disabled via feature flag");
        return;
      }

      logger.info("Group chat replies are enabled");

      // Check user rate limit for AI queries
      const canQuery = await canMakeAiQuery(userId);
      if (!canQuery) {
        logger.warn(
          { userId, username },
          "User rate limited for AI queries - skipping"
        );
        return;
      }

      logger.info("User rate limit for AI queries is not exceeded");

      // Execute AI query detection with rate limiting
      const detection = await executeAiQuery(userId, async () => {
        return await detectStudyMaterialQuery(message);
      });

      logger.info({ userId, detection }, "Query detection result");

      isQuery = detection.isQuery && detection.confidence >= 60;
      shouldRespond = isQuery; // Only respond to queries in groups
    } else {
      // PRIVATE CHAT: Always respond, no AI needed
      shouldRespond = true;
      logger.debug({ userId }, "Private chat - always respond");
    }

    // Check chat rate limit for responses
    const canRespond = await canRespondInChat(chatId);
    if (!canRespond) {
      logger.warn(
        { chatId, isGroupChat },
        "Chat rate limited for bot responses - skipping"
      );
      return;
    }

    if (shouldRespond) {
      try {
        // Execute response with rate limiting
        await executeResponse(chatId, async () => {
          const privateChatLink = `https://t.me/${BOT_USERNAME}`;
          let responseMessage;
          let replyMarkup;

          if (isGroupChat) {
            // Group Chat: Only respond to queries
            responseMessage =
              `Meow! I can help with that, ${username}\n\n` +
              `Chat with me privately and I'll find what you need:\n` +
              `🐱 [Talk to Luna](${privateChatLink})\n` +
              `📚 [Browse web](${LEARNVERSE_BASE_URL})`;

            replyMarkup = {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_to_message_id: ctx.message.message_id,
            };
          } else {
            // Private Chat: Respond to everything with Luna's personality

            // Standard helpful response
            responseMessage =
              `Meow! Luna here! 🐈\n\n` +
              `I'm your classy study companion (and an orange cat! ✨).\n` +
              `I'm here to provide study materials.\n\n` +
              `*How I can help:*\n` +
              `/search - Browse my organized library 📚\n` +
              `/help - See commands\n\n` +
              `Just use /search and I'll guide you! `;

            const { Markup } = await import("telegraf");
            const TELEGRAM_GROUP_LINK = "https://t.me/+pqv5-taDH60wNjFl";

            replyMarkup = {
              parse_mode: "Markdown",
              ...Markup.inlineKeyboard([
                [Markup.button.url("Join Study Group", TELEGRAM_GROUP_LINK)],
              ]),
            };
          }

          await ctx.reply(responseMessage, replyMarkup);

          logger.info(
            { userId, chatId, isGroupChat, isQuery },
            "Sent response"
          );
        });
      } catch (error) {
        // Handle Rate Limiting with a fun message
        if (error.message === "RATE_LIMITED") {
          logger.warn(
            { userId, chatId },
            "Rate limit hit - sending fun message"
          );

          // Only send rate limit message in private chats to avoid spamming groups
          if (!isGroupChat) {
            const funRateLimitMsg =
              `Meow! 😿 Hold on! It's my lunch time 🐟 (I'm eating fish).\n` +
              `Please wait a moment, I'll be back soon! `;
            await ctx.reply(funRateLimitMsg);
          }
          return;
        }
        throw error; // Re-throw other errors
      }
    } else {
      logger.debug(
        { userId, confidence: detection.confidence },
        "Group message ignored (not a query)"
      );
    }
  } catch (error) {
    if (error.message === "RATE_LIMITED") {
      logger.warn(
        { userId, chatId },
        "Rate limit exceeded - skipping response"
      );
      return; // Silently skip
    }

    logger.error(
      { error: error.message, userId },
      "Error in text message handler"
    );
    // Don't send error messages to user for text messages
  }
}
