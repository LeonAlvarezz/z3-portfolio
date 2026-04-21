import {
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categoryOnBlogs, users } from ".";
import { isoTimestamp } from "../common/iso-timestamp";
import { timestamps } from "../common";

export const blogs = pgTable("blogs", {
  id: uuid().defaultRandom().notNull().primaryKey(),
  published_at: isoTimestamp({ mode: "string" }),
  slug: text().unique().notNull(),
  title: text().notNull(),
  content: json(),
  cover_url: text(),
  description: text().notNull(),
  user_id: integer()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const blogRelation = relations(blogs, ({ one, many }) => ({
  user: one(users, {
    fields: [blogs.user_id],
    references: [users.id],
  }),
  category_on_blogs: many(categoryOnBlogs),
}));
