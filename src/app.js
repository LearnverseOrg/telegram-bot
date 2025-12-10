import express from "express";
import cors from "cors";
import { bot } from "./services/telegraf.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(cors());
app.use(express.json());

bot
  .launch()
  .then(() => console.log("Bot started successfully"))
  .catch((err) => console.error("Bot launch failed:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default app;
