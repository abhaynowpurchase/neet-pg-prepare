import { schedule } from "@netlify/functions";
import { runScheduler } from "../../lib/schedulerRunner";

// Runs every day at 2:00 AM UTC
export const handler = schedule("0 2 * * *", async () => {
  console.log("[Netlify Cron] refresh-content started at", new Date().toISOString());

  try {
    const result = await runScheduler();
    console.log("[Netlify Cron] Done:", result);
    return { statusCode: 200 };
  } catch (err) {
    console.error("[Netlify Cron] Failed:", err);
    return { statusCode: 500 };
  }
});
