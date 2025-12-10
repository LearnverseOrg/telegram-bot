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
    `📋 *Available Commands:*\n\n` +
    `/start - Start the bot and see welcome message\n` +
    `/help - Display this help message\n` +
    `/search - Search and download files by branch and year\n\n` +
    `Need more help? Contact support!`;

  await ctx.reply(helpMessage, { parse_mode: "Markdown" });
  console.log("Help command executed successfully");
};

// Export file search handlers from the file-search-handlers file
export * from "./file-search-handlers.js";
