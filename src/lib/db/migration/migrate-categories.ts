/**
 * One-time migration: import category data from the old schema.
 *
 * Run: bun run db:migrate:categories
 */

import { eq } from "drizzle-orm";
import { db } from "../index";
import { categories, users } from "../schema";
import { CategoryModel } from "@/modules/category/category.model";

const USERNAME = "Ponleu";

const categoryData: Array<{
  name: string;
  color: CategoryModel.ColorEnum;
  created_at: string;
  updated_at: string;
}> = [
  {
    name: "JS/TS",
    color: CategoryModel.ColorEnum.BLUE,
    created_at: "2025-03-13 07:07:25.121",
    updated_at: "2025-03-13 07:07:25.121",
  },
  {
    name: "NextJS",
    color: CategoryModel.ColorEnum.GRAY,
    created_at: "2025-06-14 08:14:55.386",
    updated_at: "2025-06-14 08:15:04.803",
  },
  {
    name: "Flutter",
    color: CategoryModel.ColorEnum.BLUE,
    created_at: "2025-06-14 10:03:29.788",
    updated_at: "2025-06-14 10:03:29.788",
  },
  {
    name: "Supabase",
    color: CategoryModel.ColorEnum.GREEN,
    created_at: "2025-06-14 10:04:17.838",
    updated_at: "2025-06-14 10:04:24.874",
  },
  {
    name: "Vue",
    color: CategoryModel.ColorEnum.TEAL,
    created_at: "2026-01-30 17:36:51.046",
    updated_at: "2026-01-30 17:37:01.918",
  },
  {
    name: "NestJS",
    color: CategoryModel.ColorEnum.RED,
    created_at: "2026-01-30 17:37:11.618",
    updated_at: "2026-01-30 17:37:23.978",
  },
  {
    name: "React",
    color: CategoryModel.ColorEnum.BLUE,
    created_at: "2026-04-18 04:58:17.232",
    updated_at: "2026-04-18 04:58:17.232",
  },
  {
    name: "Elysia",
    color: CategoryModel.ColorEnum.VIOLET,
    created_at: "2026-04-18 04:58:30.635",
    updated_at: "2026-04-18 04:59:09.575",
  },
  {
    name: "Vite",
    color: CategoryModel.ColorEnum.PURPLE,
    created_at: "2026-04-18 04:58:26.583",
    updated_at: "2026-04-18 04:59:21.093",
  },
];

async function main() {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, USERNAME))
    .limit(1);

  if (!user) {
    throw new Error(`User "${USERNAME}" not found. Run the seed first.`);
  }

  console.log(`Found user id: ${user.id}`);

  await db
    .insert(categories)
    .values(
      categoryData.map((c) => ({
        name: c.name,
        color: c.color,
        user_id: user.id,
      })),
    )
    .onConflictDoNothing({ target: categories.id });

  console.log(`✓ Migrated ${categoryData.length} categories`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
