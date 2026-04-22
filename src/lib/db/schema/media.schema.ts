import { integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from ".";
import { simpleTimestamps } from "../common";

export const media = pgTable("media", {
  id: serial().primaryKey(),
  storage_key: text().notNull().unique(),
  file_name: text().notNull(),
  mime_type: text().notNull(),
  size: integer().notNull(),
  user_id: integer()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...simpleTimestamps,
});

export const mediaRelation = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.user_id],
    references: [users.id],
  }),
}));
