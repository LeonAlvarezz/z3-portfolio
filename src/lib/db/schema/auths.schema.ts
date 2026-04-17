import { pgTable, timestamp, serial, integer, text } from "drizzle-orm/pg-core";
import { timestamps } from "../common";
import { relations } from "drizzle-orm";
import { users } from ".";

export const auths = pgTable("auths", {
	id: serial().primaryKey(),
	user_id: integer()
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: "cascade" }),
	password_hash: text().notNull(),
	password_updated_at: timestamp({ mode: "string" }).notNull().defaultNow(),
	...timestamps,
});

export const authsRelations = relations(auths, ({ one }) => ({
	user: one(users, {
		fields: [auths.user_id],
		references: [users.id],
	}),
}));
