import { integer, pgTable, serial, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { portfolios } from "./portfolios.schema";
import { media } from "./media.schema";

export const portfolioGallery = pgTable("portfolio_gallery", {
  id: serial().primaryKey(),
  portfolio_id: uuid()
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  asset_id: integer()
    .notNull()
    .references(() => media.id, { onDelete: "cascade" }),
  position: integer().notNull().default(0),
});

export const portfolioGalleryRelation = relations(
  portfolioGallery,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [portfolioGallery.portfolio_id],
      references: [portfolios.id],
    }),
    asset: one(media, {
      fields: [portfolioGallery.asset_id],
      references: [media.id],
    }),
  }),
);
