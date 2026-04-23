/**
 * One-time migration: insert category_on_portfolios join records.
 *
 * Run: bun run db:migrate:portfolio-categories
 */

import { db } from "../index";
import { categoryOnBlogs, categoryOnPortfolios } from "../schema";

// Category name → new integer id (from migrated categories table)
const CATEGORY = {
  JS_TS: 1,
  NextJS: 2,
  Flutter: 3,
  Supabase: 4,
  Vue: 5,
  NestJS: 6,
  React: 7,
  Elysia: 8,
  Vite: 9,
};

const mappings: Array<{ blog_id: string; category_id: number }> = [
  // z3-wallet
  {
    blog_id: "273775bb-f316-4fe5-8c48-93721b0f1743",
    category_id: CATEGORY.JS_TS,
  },
];

async function main() {
  await db.insert(categoryOnBlogs).values(mappings).onConflictDoNothing();

  console.log(`✓ Inserted ${mappings.length} category_on_blogs records`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
