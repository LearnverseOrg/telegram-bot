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
  // reject if the user is a bot
  if (isBot(ctx)) {
    if (isPrivateChat(ctx)) {
      await ctx.reply("You are a bot, bots are not allowed");
    }
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
