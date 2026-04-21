import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { enumToPgEnum, timestamps } from "../common";
import { categoryOnBlogs, categoryOnPortfolios, users } from ".";
import { relations } from "drizzle-orm";
import { CategoryModel } from "@/modules/category/category.model";
export const categoryColorEnum = pgEnum(
  "CategoryColorEnum",
  enumToPgEnum(CategoryModel.ColorEnum),
);
export const categories = pgTable("categories", {
  id: uuid().defaultRandom().notNull().primaryKey(),
  name: text().notNull(),
  color: categoryColorEnum().default(CategoryModel.ColorEnum.BLUE),
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
