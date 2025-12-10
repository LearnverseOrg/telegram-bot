import { NODE_ENV, TELEGRAM_BOT_BASE_URL } from "../config/config.js";

export function startSelfPing() {
  if (NODE_ENV !== "production") return;

  setInterval(async () => {
    try {
      const res = await fetch(TELEGRAM_BOT_BASE_URL);
      console.log(`[KeepAlive] Pinged self: ${res.status}`);
    } catch (err) {
      console.error("[KeepAlive] Ping failed:", err);
    }
  }, 1000 * 60 * 10);
}
