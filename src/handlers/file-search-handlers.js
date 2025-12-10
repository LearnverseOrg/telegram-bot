import { LEARNVERSE_BASE_URL } from "../config/config.js";
import {
  getBranches,
  getBranchById,
  getYearById,
  getSyllabusById,
  getSubjectById,
} from "../helpers/data-helper.js";
import logger from "../helpers/logger.js";

/**
 * Handler for /search command - shows branch selection for file search
 */
export const searchCommandHandler = async (ctx) => {
  logger.info(
    { userId: ctx.from.id, username: ctx.from.username },
    "Search command initiated"
  );

  try {
    const branchesResponse = await getBranches();

    if (!branchesResponse || !branchesResponse.success) {
      logger.error("Failed to fetch branches");
      await ctx.reply("❌ Failed to fetch branches. Please try again later.");
      return;
    }

    const branches = branchesResponse.data || [];
    logger.debug({ branchCount: branches.length }, "Branches fetched");

    if (branches.length === 0) {
      await ctx.reply("⚠️ No branches available at the moment.");
      return;
    }

    const inlineKeyboard = branches.map((branch) => [
      {
        text: `📚 ${branch.name} (${branch.code})`,
        callback_data: `branch_${branch._id}`,
      },
    ]);

    await ctx.reply(
      "*🔍 Search Files*\n\nSelect your branch to find study materials and files:",
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
        parse_mode: "Markdown",
      }
    );

    logger.info("Branch selection sent successfully");
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "Error in search command"
    );
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
};

/**
 * Handler for branch selection callback - shows year selection
 */
export const branchSelectionHandler = async (ctx) => {
  const branchId = ctx.callbackQuery.data.replace("branch_", "");
  logger.info({ branchId, userId: ctx.from.id }, "Branch selected");

  try {
    await ctx.answerCbQuery();

    const branchResponse = await getBranchById(branchId);

    if (!branchResponse || !branchResponse.success) {
      logger.error({ branchId }, "Failed to fetch branch details");
      await ctx.reply("❌ Failed to fetch branch details. Please try again.");
      return;
    }

    const branch = branchResponse.data;
    if (!branch) {
      await ctx.reply("❌ Branch not found. Please try again.");
      return;
    }

    const years = branch.years || [];
    logger.debug(
      { branchId, yearCount: years.length },
      "Years fetched for branch"
    );

    if (years.length === 0) {
      await ctx.reply(
        `⚠️ No years available for ${branch.name} at the moment.`
      );
      return;
    }

    const inlineKeyboard = years.map((year) => [
      {
        text: `📅 ${year.code}`,
        callback_data: `year_${year._id}_branch_${branchId}`,
      },
    ]);

    inlineKeyboard.push([
      {
        text: "⬅️ Back to Branches",
        callback_data: "back_to_branches",
      },
    ]);

    await ctx.editMessageText(
      `*🎓 ${branch.name} (${branch.code})*\n\n` +
        `Select your year to find files:`,
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    logger.error(
      { error: error.message, branchId },
      "Error in branch selection"
    );
    await ctx.answerCbQuery("❌ An error occurred");
    await ctx.reply("❌ An error occurred. Please try again.");
  }
};

/**
 * Handler for year selection callback - shows syllabus selection
 */
export const yearSelectionHandler = async (ctx) => {
  // Extract year ID and branch ID from callback data
  // Format: year_{yearId}_branch_{branchId}
  const callbackData = ctx.callbackQuery.data;
  const yearMatch = callbackData.match(/year_([^_]+)/);
  const branchMatch = callbackData.match(/branch_([^_]+)/);

  const yearId = yearMatch ? yearMatch[1] : null;
  const branchId = branchMatch ? branchMatch[1] : null;

  logger.info({ yearId, branchId, userId: ctx.from.id }, "Year selected");

  try {
    if (!yearId) {
      logger.error("Failed to extract year ID from callback data");
      await ctx.answerCbQuery("❌ Invalid data");
      return;
    }

    await ctx.answerCbQuery();

    const yearResponse = await getYearById(yearId);

    if (!yearResponse || !yearResponse.success) {
      logger.error("Failed to fetch year details - no success in response");
      await ctx.reply("❌ Failed to fetch year details. Please try again.");
      return;
    }

    const year = yearResponse.data;
    if (!year) {
      logger.error("No year data in response");
      await ctx.reply("❌ Year not found. Please try again.");
      return;
    }

    const syllabuses = year.syllabuses || [];
    logger.debug(
      { yearId, syllabusCount: syllabuses.length },
      "Syllabuses fetched"
    );

    if (syllabuses.length === 0) {
      logger.warn("No syllabuses available for this year");
      await ctx.reply(
        `⚠️ No syllabuses available for ${
          year.name || year.code
        } at the moment.`
      );
      return;
    }

    // Create inline keyboard with syllabuses
    // Shorten callback data to avoid Telegram's 64-byte limit
    const inlineKeyboard = syllabuses.map((syllabus) => {
      return [
        {
          text: `📋 Pattern ${syllabus.patternYear}`,
          callback_data: `syl_${syllabus._id}_y_${yearId}`,
        },
      ];
    });

    // Add back button with branch ID to go back to years
    inlineKeyboard.push([
      {
        text: "⬅️ Back to Years",
        callback_data: branchId ? `branch_${branchId}` : "back_to_branches",
      },
    ]);

    await ctx.editMessageText(
      `*📚 ${year.name || year.code} - ${
        year.branch?.university || "University"
      }*\n\n` + `Select the pattern to view available files:`,
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    logger.error("=== ERROR IN YEAR SELECTION HANDLER ===");
    logger.error("Error message:", error.message);
    logger.error("Error stack:", error.stack);
    await ctx.answerCbQuery("❌ An error occurred");
    await ctx.reply("❌ An error occurred. Please try again.");
  } finally {
  }
};

/**
 * Handler for syllabus selection callback - shows subjects list
 */
export const fileDetailsHandler = async (ctx) => {
  try {
    // Extract syllabus ID and year ID from callback data
    // New shortened format: syl_{syllabusId}_y_{yearId}
    const callbackData = ctx.callbackQuery.data;
    const syllabusMatch = callbackData.match(/syl_([^_]+)/);
    const yearMatch = callbackData.match(/y_([^_]+)/);

    const syllabusId = syllabusMatch ? syllabusMatch[1] : null;
    const yearId = yearMatch ? yearMatch[1] : null;

    if (!syllabusId) {
      logger.error("Failed to extract syllabus ID from callback data");
      await ctx.answerCbQuery("❌ Invalid data");
      return;
    }

    // Acknowledge the callback to remove loading state
    await ctx.answerCbQuery("Loading subjects...");

    // Fetch syllabus details to get subjects
    const syllabusResponse = await getSyllabusById(syllabusId);

    if (!syllabusResponse || !syllabusResponse.success) {
      logger.error("Failed to fetch syllabus - no success in response");
      await ctx.reply("❌ Failed to load subjects. Please try again.");
      return;
    }

    const syllabus = syllabusResponse.data;
    if (!syllabus) {
      logger.error("No syllabus data in response");
      await ctx.reply("❌ Syllabus not found. Please try again.");
      return;
    }

    const subjects = syllabus.subjects || [];

    if (subjects.length === 0) {
      logger.warn("No subjects available for this syllabus");
      await ctx.editMessageText(
        `*📚 Pattern ${syllabus.patternYear}*\n\n` +
          `⚠️ No subjects available at the moment.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⬅️ Back",
                  callback_data: yearId
                    ? `back_year_${yearId}`
                    : "back_to_branches",
                },
              ],
            ],
          },
          parse_mode: "Markdown",
        }
      );
      return;
    }

    // Create inline keyboard with subjects
    // Use shortened format: sub_{subjectId}_syl_{syllabusId}
    const inlineKeyboard = subjects.map((subject) => {
      return [
        {
          text: `📖 ${subject.code} - ${subject.name}`,
          callback_data: `sub_${subject._id}_s_${syllabusId}`,
        },
      ];
    });

    // Add back button
    inlineKeyboard.push([
      {
        text: "⬅️ Back to Patterns",
        callback_data: yearId ? `back_year_${yearId}` : "back_to_branches",
      },
    ]);

    const yearInfo = syllabus.academicYear
      ? `${syllabus.academicYear.name} (${syllabus.academicYear.code})`
      : "";

    await ctx.editMessageText(
      `*📚 ${yearInfo} - Pattern ${syllabus.patternYear}*\n\n` +
        `Select a subject to view materials:`,
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    logger.error("=== ERROR IN FILE DETAILS HANDLER ===");
    logger.error("Error message:", error.message);
    logger.error("Error stack:", error.stack);
    await ctx.answerCbQuery("❌ An error occurred");
    await ctx.reply("❌ An error occurred. Please try again.");
  } finally {
  }
};

/**
 * Handler for back to branches callback
 */
export const backToBranchesHandler = async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const branchesResponse = await getBranches();

    if (!branchesResponse || !branchesResponse.success) {
      logger.error("Failed to fetch branches - no success in response");
      await ctx.reply("❌ Failed to fetch branches. Please try again later.");
      return;
    }

    const branches = branchesResponse.data || [];

    if (branches.length === 0) {
      logger.warn("No branches available");
      await ctx.reply("⚠️ No branches available at the moment.");
      return;
    }

    // Create inline keyboard with branches
    const inlineKeyboard = branches.map((branch) => {
      return [
        {
          text: `📚 ${branch.name} (${branch.code})`,
          callback_data: `branch_${branch._id}`,
        },
      ];
    });

    await ctx.editMessageText(
      "*🔍 Search Files*\n\nSelect your branch to find study materials and files:",
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    logger.error("=== ERROR IN BACK TO BRANCHES HANDLER ===");
    logger.error("Error message:", error.message);
    logger.error("Error stack:", error.stack);
    await ctx.answerCbQuery("❌ An error occurred");
  } finally {
  }
};
/**
 * Handler for subject selection - shows all materials (notes, PYQs, books, etc.)
 */
export const subjectDetailsHandler = async (ctx) => {
  try {
    // Extract subject ID and syllabus ID from callback data
    // Format: sub_{subjectId}_s_{syllabusId}
    const callbackData = ctx.callbackQuery.data;
    const subjectMatch = callbackData.match(/sub_([^_]+)/);
    const syllabusMatch = callbackData.match(/s_([^_]+)/);

    const subjectId = subjectMatch ? subjectMatch[1] : null;
    const syllabusId = syllabusMatch ? syllabusMatch[1] : null;

    if (!subjectId) {
      logger.error("Failed to extract subject ID from callback data");
      await ctx.answerCbQuery("❌ Invalid data");
      return;
    }

    // Acknowledge the callback
    await ctx.answerCbQuery("Loading materials...");

    // Fetch subject details
    const subjectResponse = await getSubjectById(subjectId);

    if (!subjectResponse || !subjectResponse.success) {
      logger.error("Failed to fetch subject - no success in response");
      await ctx.reply("❌ Failed to load materials. Please try again.");
      return;
    }

    const subject = subjectResponse.data;
    if (!subject) {
      logger.error("No subject data in response");
      await ctx.reply("❌ Subject not found. Please try again.");
      return;
    }

    // Build the materials message
    let message = `*📖 ${subject.name}*\n`;
    message += `_Code: ${subject.code}_\n`;
    message += `_Pattern: ${subject.syllabus?.patternYear || "N/A"}_\n\n`;

    const baseUrl = `${LEARNVERSE_BASE_URL}/viewer`;
    let hasContent = false;

    // Notes (Units)
    if (subject.units && subject.units.length > 0) {
      message += `*📝 Notes*\n`;

      // Sort units by unitNumber
      const sortedUnits = [...subject.units].sort(
        (a, b) => a.unitNumber - b.unitNumber
      );

      sortedUnits.forEach((unit) => {
        if (unit.files && unit.files.length > 0) {
          message += `\n_Unit ${unit.unitNumber}:_\n`;
          unit.files.forEach((file) => {
            const link = `${baseUrl}/${file._id}`;
            message += `• [${file.fileName}](${link})\n`;
          });
        }
      });
      message += `\n`;
      hasContent = true;
    }

    // Previous Year Questions - InSem
    if (subject.previousYear?.insem && subject.previousYear.insem.length > 0) {
      message += `*📄 Previous Year Questions (InSem)*\n`;
      subject.previousYear.insem.forEach((pyq) => {
        const link = `${baseUrl}/${pyq._id}`;
        message += `• [${pyq.fileName}](${link})\n`;
      });
      message += `\n`;
      hasContent = true;
    }

    // Previous Year Questions - EndSem
    if (
      subject.previousYear?.endsem &&
      subject.previousYear.endsem.length > 0
    ) {
      message += `*📄 Previous Year Questions (EndSem)*\n`;
      subject.previousYear.endsem.forEach((pyq) => {
        const link = `${baseUrl}/${pyq._id}`;
        message += `• [${pyq.fileName}](${link})\n`;
      });
      message += `\n`;
      hasContent = true;
    }

    // Decodes
    if (subject.decodes && subject.decodes.length > 0) {
      message += `*🔍 Decodes*\n`;
      subject.decodes.forEach((decode) => {
        const link = `${baseUrl}/${decode._id}`;
        message += `• [${decode.fileName}](${link})\n`;
      });
      message += `\n`;
      hasContent = true;
    }

    // Books
    if (subject.books && subject.books.length > 0) {
      message += `*📚 Books*\n`;
      subject.books.forEach((book) => {
        const link = `${baseUrl}/${book._id}`;
        message += `• [${book.fileName}](${link})\n`;
      });
      message += `\n`;
      hasContent = true;
    }

    if (!hasContent) {
      message += `_No materials available for this subject yet._\n`;
    }

    // Back button
    const backButton = [
      [
        {
          text: "⬅️ Back to Subjects",
          callback_data: syllabusId
            ? `back_syl_${syllabusId}`
            : "back_to_branches",
        },
      ],
      [
        {
          text: "🏠 Start Over",
          callback_data: "back_to_branches",
        },
      ],
    ];

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: backButton,
      },
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (error) {
    logger.error("=== ERROR IN SUBJECT DETAILS HANDLER ===");
    logger.error("Error message:", error.message);
    logger.error("Error stack:", error.stack);
    await ctx.answerCbQuery("❌ An error occurred");
    await ctx.reply("❌ An error occurred. Please try again.");
  } finally {
  }
};
