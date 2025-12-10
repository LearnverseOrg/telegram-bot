import app from "./src/app.js";
import { PORT } from "./src/config/config.js";

import { connectDB } from "./src/config/db.js";
import { bot } from "./src/services/telegraf.js";

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();

    bot
      .launch()
      .then(() => console.log("Bot started successfully"))
      .catch((err) => console.error("Bot launch failed:", err));

    // startCronJob();
  });
};

startServer();
