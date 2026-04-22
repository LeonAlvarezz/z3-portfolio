import { db } from "@/lib/db";
import logger from "@/lib/logger";
import { seedBase } from "./seed-base";

async function main() {
  try {
    logger.info("Starting production seed");
    await db.transaction(async (tx) => {
      await seedBase(tx);
    });
    logger.info("Production seed completed");
    process.exit(0);
  } catch (error) {
    logger.error("Production seed failed", error);
    process.exit(1);
  }
}

main();
