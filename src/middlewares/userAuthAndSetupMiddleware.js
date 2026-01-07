import {
  checkGroupChat,
  checkIfNewUser,
  isBot,
  isPrivateChat,
} from "../helpers/bot-helpers.js";
import { createUserIfNotExists } from "../helpers/user-helper.js";
import { BOT_USERNAME } from "../config/config.js";
import logger from "../helpers/logger.js";

export const userAuthAndSetupMiddleware = async (ctx, next) => {
  // reject if the user is a bot
  if (isBot(ctx)) {
    if (isPrivateChat(ctx)) {
      await ctx.reply("You are a bot, bots are not allowed");
    }
    return;
  }

  // For group chats, skip user creation but allow processing
  if (!isPrivateChat(ctx)) {
    next();
    return;
  }

  // create user if not exists (only for private chats)
  const user = await createUserIfNotExists(ctx);
  ctx.state.user = user;
  next();
};

export const checkGroupChatMiddleware = async (ctx, next) => {
  // save ctx in json file

  if (checkGroupChat(ctx) && checkIfNewUser(ctx)) {
    const privateChatLink = `https://t.me/${BOT_USERNAME}`;
    return;
  }

  // Allow text messages in groups to pass through for query detection
  // But skip command processing in groups (commands only work in private chat)
  if (checkGroupChat(ctx)) {
    if (ctx.message?.text && !ctx.message.text.startsWith("/")) {
      // Let text messages through for query detection
      next();
      return;
    }
    // Block commands and other interactions in groups
    return;
  }

  // For private chats, always continue
  next();
};
