import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "../common";
import { auths } from "./auths.schema";
import { roles } from "./roles.schema";
import { sessions } from ".";

export const users = pgTable("users", {
	id: serial().primaryKey(),
	public_id: uuid().defaultRandom().unique().notNull(),
	username: text().notNull().unique(),
	email: text().notNull().unique(),
	avatar_url: text(),
	last_login_at: timestamp({ mode: "string" }),
	role_id: integer()
		.notNull()
		.references(() => roles.id, { onDelete: "cascade" }),
	...timestamps,
});

export const userRelation = relations(users, ({ one, many }) => ({
	auth: one(auths, {
		fields: [users.id],
		references: [auths.user_id],
	}),
	role: one(roles, {
		fields: [users.role_id],
		references: [roles.id],
	}),
	session: many(sessions),
}));
