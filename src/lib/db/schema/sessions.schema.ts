import { relations } from "drizzle-orm";
import { pgTable, integer, text, serial } from "drizzle-orm/pg-core";
import { users } from ".";
import { timestamps } from "../common";
import { isoTimestamp as timestamp } from "@/lib/db/common/iso-timestamp";

export const sessions = pgTable("sessions", {
  // Opaque session identifier (safe to expose)
  id: serial().primaryKey(),
  user_id: integer()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Store hashes (not raw tokens) if you’re persisting refresh/session tokens
  session_token_hash: text().notNull().unique(),
  // Metadata (optional but useful)
  ip: text(),
  user_agent: text(),
  expires_at: timestamp({ mode: "string" }).notNull(),
  ...timestamps,
});

export const sessionRelation = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));
