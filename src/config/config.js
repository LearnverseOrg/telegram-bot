import dotenv from "dotenv";
dotenv.config({
  debug: false,
});

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME;
const LEARNVERSE_BASE_URL = process.env.LEARNVERSE_BASE_URL;
const LEARNVERSE_API_BASE_URL = process.env.LEARNVERSE_API_BASE_URL;
const NODE_ENV = process.env.NODE_ENV || "development";

export {
  PORT,
  MONGO_URI,
  TELEGRAM_BOT_TOKEN,
  BOT_USERNAME,
  LEARNVERSE_BASE_URL,
  LEARNVERSE_API_BASE_URL,
  NODE_ENV,
};
