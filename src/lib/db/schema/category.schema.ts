import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { enumToPgEnum, timestamps } from "../common";
import { CategoryColorEnum } from "@/modules/category/model/category.enum";
import { categoryOnBlogs, categoryOnPortfolios, users } from ".";
import { relations } from "drizzle-orm";
export const categoryColorEnum = pgEnum(
	"CategoryColorEnum",
	enumToPgEnum(CategoryColorEnum),
);
export const categories = pgTable("categories", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	name: text().notNull(),
	color: categoryColorEnum().default(CategoryColorEnum.BLUE),
	user_id: integer()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	...timestamps,
});

export const categoryRelation = relations(categories, ({ one, many }) => ({
	user: one(users, {
		fields: [categories.user_id],
		references: [users.id],
	}),
	category_on_blog: many(categoryOnBlogs),
	category_on_portfolio: many(categoryOnPortfolios),
}));
