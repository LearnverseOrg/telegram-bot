import {
  checkGroupChat,
  checkIfNewUser,
  isBot,
  isPrivateChat,
} from "../helpers/bot-helpers.js";
import { createUserIfNotExists } from "../helpers/user-helper.js";
import { BOT_USERNAME } from "../config/config.js";
import logger from "../helpers/logger.js";
import fs from "fs";

export const userAuthAndSetupMiddleware = async (ctx, next) => {
  // Skip middleware for callback queries (inline button clicks)
  // Callback queries don't have message context and are already authenticated
  if (ctx.updateType === "callback_query") {
    logger.debug("Skipping middleware for callback query");
    return next();
  }

  // Only validate for messages and commands
  if (!ctx.update.message) {
    // Skip for other update types (edited messages, etc.)
    return next();
  }

  // reject if the user is a bot
  if (isBot(ctx)) {
    ctx.reply("You are a bot, bots are not allowed");
    return;
  }

  // reject if the user is not in a private chat
  if (!isPrivateChat(ctx)) {
    return;
  }

  // create user if not exists
  await createUserIfNotExists(ctx);
  next();
};

export const checkGroupChatMiddleware = async (ctx, next) => {
  // save ctx in json file
  fs.writeFileSync("ctx.json", JSON.stringify(ctx));
  if (checkGroupChat(ctx) && checkIfNewUser(ctx)) {
    const privateChatLink = `https://t.me/${BOT_USERNAME}`;
    const message = `Welcome to the group! For any study materials, you can use our bot directly: <a href="${privateChatLink}">Start Private Chat with Learnerse Bot</a>`;
    ctx.reply(message, { parse_mode: "HTML" });
    return;
  }
  next();
};
