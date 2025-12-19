import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LOG_DIR_PATH = path.join(__dirname, "../../logs");

export const commands = [
  { command: "start", description: "Start bot" },
  { command: "help", description: "Help" },
  { command: "search", description: "Search files" },
];
