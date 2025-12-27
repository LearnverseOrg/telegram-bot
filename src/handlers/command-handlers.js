import { Markup } from "telegraf";

const TELEGRAM_GROUP_LINK = "https://t.me/+pqv5-taDH60wNjFl";

export const startCommandHandler = async (ctx) => {
  console.log("=== START COMMAND ===");
  console.log("User:", ctx.from.username || ctx.from.id);

  const welcomeMessage =
    `Hey! I'm LearnverseBot \n\n` +
    `I help students find study materials - notes, PYQs, syllabuses, you name it.\n` +
    `Everything's organized and ready for you.\n\n` +
    `Try /search to get started, or /help if you need guidance.\n\n` +
    `Happy studying!`;

  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.url("Join Study Group", TELEGRAM_GROUP_LINK)],
    ]),
  });
  console.log("Start command executed successfully");
};

export const helpCommandHandler = async (ctx) => {
  console.log("=== HELP COMMAND ===");
  console.log("User:", ctx.from.username || ctx.from.id);

  const helpMessage =
    `LearnverseBot here! \n\n` +
    `I've organized all your study materials - just tell me what you need.\n\n` +
    `*Commands:*\n` +
    `/search - Browse materials by branch, year, and subject\n` +
    `/help - Show this message\n` +
    `/start - Start over\n\n` +
    `Pro tip: Use /search and I'll guide you through everything step by step. `;

  await ctx.reply(helpMessage, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.url("Join Study Group", TELEGRAM_GROUP_LINK)],
    ]),
  });
  console.log("Help command executed successfully");
};

// Export file search handlers from the file-search-handlers file
export * from "./file-search-handlers.js";
