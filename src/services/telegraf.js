import { Telegraf } from "telegraf";
import { TELEGRAM_BOT_TOKEN } from "../config/config.js";
import {
  startCommandHandler,
  helpCommandHandler,
  searchCommandHandler,
  branchSelectionHandler,
  yearSelectionHandler,
  fileDetailsHandler,
  subjectDetailsHandler,
  backToBranchesHandler,
} from "../handlers/command-handlers.js";

import { commands } from "../config/constants.js";
import { userAuthAndSetupMiddleware } from "../middlewares/userAuthAndSetupMiddleware.js";
import logger from "../helpers/logger.js";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.use(userAuthAndSetupMiddleware);

bot.telegram.setMyCommands(commands);

// Command handlers
bot.start(async (ctx) => {
  await startCommandHandler(ctx);
});

bot.command("help", async (ctx) => {
  await helpCommandHandler(ctx);
});

bot.command("search", async (ctx) => {
  logger.info({ userId: ctx.from.id }, "/search command triggered");
  await searchCommandHandler(ctx);
});

// Callback query handlers for file search navigation
bot.action(/^branch_/, async (ctx) => {
  logger.info({ userId: ctx.from.id }, "Branch callback triggered");
  await branchSelectionHandler(ctx);
});

bot.action(/^year_/, async (ctx) => {
  logger.info("=== Year callback triggered ===");
  await yearSelectionHandler(ctx);
});

// Handle shortened syllabus callback (syl_ instead of syllabus_)
bot.action(/^syl_/, async (ctx) => {
  logger.info("=== File/Syllabus callback triggered ===");
  await fileDetailsHandler(ctx);
});

// Handle subject selection
bot.action(/^sub_/, async (ctx) => {
  logger.info("=== Subject callback triggered ===");
  await subjectDetailsHandler(ctx);
});

bot.action("back_to_branches", async (ctx) => {
  logger.info("=== Back to branches callback triggered ===");
  await backToBranchesHandler(ctx);
});

// Handle back to syllabus (subjects list) from subject details
bot.action(/^back_syl_/, async (ctx) => {
  logger.info("=== Back to syllabus callback triggered ===");
  const syllabusId = ctx.callbackQuery.data.replace("back_syl_", "");

  // Re-trigger file details handler which shows subjects
  // Need to construct a proper callback with yearId, but we can fetch from syllabus
  try {
    const { getSyllabusById } = await import("../helpers/data-helper.js");
    const syllabusResponse = await getSyllabusById(syllabusId);

    if (syllabusResponse?.success && syllabusResponse.data?.academicYear?._id) {
      const yearId = syllabusResponse.data.academicYear._id;
      ctx.callbackQuery.data = `syl_${syllabusId}_y_${yearId}`;
      await fileDetailsHandler(ctx);
    } else {
      await ctx.answerCbQuery("❌ Could not navigate back");
      await ctx.reply("Please use /search to start over.");
    }
  } catch (error) {
    logger.error("Error in back_syl handler:", error);
    await ctx.answerCbQuery("❌ An error occurred");
  }
});

// Handle back to year from file details
bot.action(/^back_year_/, async (ctx) => {
  logger.info("=== Back to year callback triggered ===");
  const yearId = ctx.callbackQuery.data.replace("back_year_", "");

  // Need to fetch year to get branch ID, then trigger year selection
  // For now, we'll fetch and re-trigger
  try {
    const { getYearById } = await import("../helpers/data-helper.js");
    const yearResponse = await getYearById(yearId);

    if (yearResponse?.success && yearResponse.data?.branch?._id) {
      const branchId = yearResponse.data.branch._id;
      // Manually construct callback data and trigger year handler
      ctx.callbackQuery.data = `year_${yearId}_branch_${branchId}`;
      await yearSelectionHandler(ctx);
    } else {
      await ctx.answerCbQuery("❌ Could not navigate back");
      await ctx.reply("Please use /search to start over.");
    }
  } catch (error) {
    logger.error("Error in back_year handler:", error);
    await ctx.answerCbQuery("❌ An error occurred");
  }
});
