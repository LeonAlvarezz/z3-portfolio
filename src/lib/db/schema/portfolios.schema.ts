import { integer, json, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../common";
import { relations } from "drizzle-orm";
import { users } from ".";
import { categoryOnPortfolios } from "./category-on-portfolio.schema";
import { isoTimestamp } from "../common/iso-timestamp";
import { media } from "./media.schema";
import { portfolioGallery } from "./portfolio-gallery.schema";

export const portfolios = pgTable("portfolios", {
  id: uuid().defaultRandom().notNull().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  slug: text().unique().notNull(),
  content: json(),
  cover_asset_id: integer().references(() => media.id, {
    onDelete: "set null",
  }),
  github_link: text(),
  preview_link: text(),
  user_id: integer()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  published_at: isoTimestamp({ mode: "string" }),
  ...timestamps,
});

export const portfolioRelation = relations(portfolios, ({ one, many }) => ({
  category_on_portfolios: many(categoryOnPortfolios),
  gallery: many(portfolioGallery),
  cover_asset: one(media, {
    fields: [portfolios.cover_asset_id],
    references: [media.id],
  }),
  user: one(users, {
    fields: [portfolios.user_id],
    references: [users.id],
  }),
}));
