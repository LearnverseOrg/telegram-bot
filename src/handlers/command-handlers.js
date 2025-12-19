export const startCommandHandler = async (ctx) => {
  console.log("=== START COMMAND ===");
  console.log("User:", ctx.from.username || ctx.from.id);

  const welcomeMessage =
    `🎓 *Welcome to Learnverse Bot!*\n\n` +
    `I can help you access:\n` +
    `• 📁 Files & Study Materials\n` +
    `• 📚 Syllabuses & PDFs\n` +
    `• 📝 Notes & Resources\n\n` +
    `Use /search to find and download files!\n` +
    `Use /help to see all available commands.`;

  await ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
  console.log("Start command executed successfully");
};

export const helpCommandHandler = async (ctx) => {
  console.log("=== HELP COMMAND ===");
  console.log("User:", ctx.from.username || ctx.from.id);

  const helpMessage =
    `🤖 *Learnverse Bot Help*\n\n` +
    `I am here to help you access study materials, notes, and syllabuses easily.\n\n` +
    `*Available Commands:*\n` +
    `/search - 🔍 Find file, syllabus & notes\n` +
    `/help - ℹ️ Show this help message\n` +
    `/start - 🔄 Restart the bot session\n\n` +
    `_Select /search to browse materials by Branch > Year > Subject_`;

  await ctx.reply(helpMessage, { parse_mode: "Markdown" });
  console.log("Help command executed successfully");
};

// Export file search handlers from the file-search-handlers file
export * from "./file-search-handlers.js";
