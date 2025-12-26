import axios from "axios";
import NodeCache from "node-cache";
import { LEARNVERSE_API_BASE_URL } from "../config/config.js";
import logger from "../helpers/logger.js";

// Cache for 5 minutes (300 seconds)
const configCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const CACHE_KEY = "telegram_config";

/**
 * Default configuration (fallback if API fails)
 */
const DEFAULT_CONFIG = {
  version: "1.0.0",
  featureFlags: {
    aiQueryDetection: true,
    groupChatReplies: true,
    rateLimiting: true,
  },
};

/**
 * Fetches Telegram bot configuration from API
 * @returns {Promise<object>} Configuration object
 */
export async function fetchTelegramConfig() {
  try {
    // Check cache first
    const cached = configCache.get(CACHE_KEY);
    if (cached) {
      logger.debug("Using cached Telegram configuration");
      return cached;
    }

    // Fetch from API
    const url = `${LEARNVERSE_API_BASE_URL}/api/v1/config/telegram`;
    logger.info({ url }, "Fetching Telegram configuration from API");

    const response = await axios.get(url, {
      timeout: 5000, // 5 second timeout
    });

    if (response.data?.success && response.data?.data) {
      const config = {
        ...DEFAULT_CONFIG,
        ...response.data.data,
        featureFlags: {
          ...DEFAULT_CONFIG.featureFlags,
          ...response.data.data.featureFlags,
        },
      };

      // Cache the config
      configCache.set(CACHE_KEY, config);
      logger.info({ config }, "Telegram configuration fetched and cached");

      return config;
    } else {
      logger.warn("Invalid response format from config API, using defaults");
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    logger.error(
      { error: error.message },
      "Failed to fetch Telegram configuration, using defaults"
    );
    return DEFAULT_CONFIG;
  }
}

/**
 * Gets a specific feature flag value
 * @param {string} flagName - Name of the feature flag
 * @returns {Promise<boolean>} Feature flag value
 */
export async function getFeatureFlag(flagName) {
  const config = await fetchTelegramConfig();
  return config.featureFlags?.[flagName] ?? false;
}

/**
 * Checks if AI query detection is enabled
 * @returns {Promise<boolean>}
 */
export async function isAiQueryDetectionEnabled() {
  return await getFeatureFlag("aiQueryDetection");
}

/**
 * Checks if group chat replies are enabled
 * @returns {Promise<boolean>}
 */
export async function isGroupChatRepliesEnabled() {
  return await getFeatureFlag("groupChatReplies");
}

/**
 * Checks if rate limiting is enabled
 * @returns {Promise<boolean>}
 */
export async function isRateLimitingEnabled() {
  return await getFeatureFlag("rateLimiting");
}

/**
 * Clears the configuration cache (useful for testing)
 */
export function clearConfigCache() {
  configCache.del(CACHE_KEY);
  logger.info("Configuration cache cleared");
}

/**
 * Gets the current bot version
 * @returns {Promise<string>}
 */
export async function getBotVersion() {
  const config = await fetchTelegramConfig();
  return config.version || "1.0.0";
}
