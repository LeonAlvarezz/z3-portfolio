import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";
import env from "@/lib/env";
export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
}) satisfies Config;
