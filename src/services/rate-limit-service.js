import Bottleneck from "bottleneck";
import { isRateLimitingEnabled } from "./config-service.js";
import logger from "../helpers/logger.js";

/**
 * Rate limiter for AI query detection
 * Limits: 10 requests per user per minute
 */
const aiQueryLimiter = new Bottleneck({
  reservoir: 10, // Initial number of requests
  reservoirRefreshAmount: 10, // Number of requests to add
  reservoirRefreshInterval: 60 * 1000, // Refresh every 60 seconds
  maxConcurrent: 5, // Max concurrent requests
  minTime: 1000, // Minimum time between requests (1 second)
});

/**
 * Rate limiter for bot responses in groups
 * Limits: 20 responses per group per minute
 */
const groupResponseLimiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 10,
  minTime: 500, // 500ms between responses
});

/**
 * Per-user rate limiters (stored by userId)
 */
const userLimiters = new Map();

/**
 * Per-chat rate limiters (stored by chatId)
 */
const chatLimiters = new Map();

/**
 * Gets or creates a rate limiter for a specific user
 * @param {number} userId - Telegram user ID
 * @returns {Bottleneck} Rate limiter instance
 */
function getUserLimiter(userId) {
  if (!userLimiters.has(userId)) {
    const limiter = new Bottleneck({
      reservoir: 5, // 5 requests per user
      reservoirRefreshAmount: 5,
      reservoirRefreshInterval: 60 * 1000, // per minute
      maxConcurrent: 1,
      minTime: 2000, // 2 seconds between requests from same user
    });

    userLimiters.set(userId, limiter);

    // Clean up old limiters after 10 minutes of inactivity
    setTimeout(() => {
      userLimiters.delete(userId);
    }, 10 * 60 * 1000);
  }

  return userLimiters.get(userId);
}

/**
 * Gets or creates a rate limiter for a specific chat
 * @param {string} chatId - Telegram chat ID
 * @returns {Bottleneck} Rate limiter instance
 */
function getChatLimiter(chatId) {
  if (!chatLimiters.has(chatId)) {
    const limiter = new Bottleneck({
      reservoir: 15, // 15 responses per chat
      reservoirRefreshAmount: 15,
      reservoirRefreshInterval: 60 * 1000, // per minute
      maxConcurrent: 3,
      minTime: 1000, // 1 second between responses in same chat
    });

    chatLimiters.set(chatId, limiter);

    // Clean up old limiters after 10 minutes of inactivity
    setTimeout(() => {
      chatLimiters.delete(chatId);
    }, 10 * 60 * 1000);
  }

  return chatLimiters.get(chatId);
}

/**
 * Checks if a user can make an AI query request
 * @param {number} userId - Telegram user ID
 * @returns {Promise<boolean>} True if allowed, false if rate limited
 */
export async function canMakeAiQuery(userId) {
  const rateLimitingEnabled = await isRateLimitingEnabled();

  if (!rateLimitingEnabled) {
    return true; // Rate limiting disabled
  }

  const userLimiter = getUserLimiter(userId);

  try {
    // Check if we can schedule (non-blocking check)
    const counts = userLimiter.counts();

    // If we're at capacity, reject
    if (counts.EXECUTING >= 1 || counts.QUEUED > 0) {
      logger.warn({ userId, counts }, "User rate limit reached for AI queries");
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error: error.message, userId }, "Error checking rate limit");
    return true; // Allow on error
  }
}

/**
 * Executes an AI query with rate limiting
 * @param {number} userId - Telegram user ID
 * @param {Function} queryFn - Function to execute
 * @returns {Promise<any>} Result of the query function
 */
export async function executeAiQuery(userId, queryFn) {
  const rateLimitingEnabled = await isRateLimitingEnabled();

  if (!rateLimitingEnabled) {
    return await queryFn(); // Execute without rate limiting
  }

  const userLimiter = getUserLimiter(userId);

  try {
    return await userLimiter.schedule(() => queryFn());
  } catch (error) {
    if (error.message.includes("rate limit")) {
      logger.warn({ userId }, "AI query rate limited");
      throw new Error("RATE_LIMITED");
    }
    throw error;
  }
}

/**
 * Checks if a bot can respond in a chat
 * @param {string} chatId - Telegram chat ID
 * @returns {Promise<boolean>} True if allowed, false if rate limited
 */
export async function canRespondInChat(chatId) {
  const rateLimitingEnabled = await isRateLimitingEnabled();

  if (!rateLimitingEnabled) {
    return true; // Rate limiting disabled
  }

  const chatLimiter = getChatLimiter(chatId);

  try {
    const counts = chatLimiter.counts();

    // If we're at capacity, reject
    if (counts.EXECUTING >= 3 || counts.QUEUED > 2) {
      logger.warn(
        { chatId, counts },
        "Chat rate limit reached for bot responses"
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error(
      { error: error.message, chatId },
      "Error checking chat rate limit"
    );
    return true; // Allow on error
  }
}

/**
 * Executes a bot response with rate limiting
 * @param {string} chatId - Telegram chat ID
 * @param {Function} responseFn - Function to execute
 * @returns {Promise<any>} Result of the response function
 */
export async function executeResponse(chatId, responseFn) {
  const rateLimitingEnabled = await isRateLimitingEnabled();

  if (!rateLimitingEnabled) {
    return await responseFn(); // Execute without rate limiting
  }

  const chatLimiter = getChatLimiter(chatId);

  try {
    return await chatLimiter.schedule(() => responseFn());
  } catch (error) {
    if (error.message.includes("rate limit")) {
      logger.warn({ chatId }, "Bot response rate limited");
      throw new Error("RATE_LIMITED");
    }
    throw error;
  }
}

/**
 * Gets rate limit statistics for monitoring
 * @returns {object} Statistics object
 */
export function getRateLimitStats() {
  return {
    activeUserLimiters: userLimiters.size,
    activeChatLimiters: chatLimiters.size,
    aiQueryLimiter: {
      executing: aiQueryLimiter.counts().EXECUTING,
      queued: aiQueryLimiter.counts().QUEUED,
    },
    groupResponseLimiter: {
      executing: groupResponseLimiter.counts().EXECUTING,
      queued: groupResponseLimiter.counts().QUEUED,
    },
  };
}

/**
 * Clears all rate limiters (useful for testing)
 */
export function clearAllLimiters() {
  userLimiters.clear();
  chatLimiters.clear();
  logger.info("All rate limiters cleared");
}
