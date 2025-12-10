import pino from "pino";
import path from "path";
import fs from "fs";
import { LOG_DIR_PATH } from "../config/constants.js";
import { NODE_ENV } from "../config/config.js";

const isProduction = NODE_ENV === "production";

const logDir = LOG_DIR_PATH;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    redact: {
      paths: ["password", "token", "creditCard"],
      censor: "[REDACTED]",
    },
  },
  isProduction
    ? pino.destination(path.join(logDir, "app.log"))
    : pino.transport({
        targets: [
          {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        ],
      })
);

export default logger;
