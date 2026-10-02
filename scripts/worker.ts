import "../src/lib/env";
import { maintenance } from "../src/server/maintenance";
import { db } from "../src/lib/db";
const once = process.argv.includes("--once");
do {
  try {
    console.log(new Date().toISOString(), await maintenance());
  } catch (e) {
    console.error("Worker failed", (e as Error).message);
    if (once) process.exitCode = 1;
  }
  if (!once) await new Promise((resolve) => setTimeout(resolve, 60_000));
} while (!once);
await db.$disconnect();
