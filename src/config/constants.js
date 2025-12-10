import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LOG_DIR_PATH = path.join(__dirname, "../../logs");

export const commands = [
  { command: "start", description: "Start the bot" },
  {
    command: "help",
    description: "Get assistance and learn about the bot's features",
  },
  {
    command: "search",
    description: "Search and download files by branch and year",
  },
];
