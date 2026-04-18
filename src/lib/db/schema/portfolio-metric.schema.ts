import { relations } from "drizzle-orm";
import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { portfolios } from ".";
import { timestamps } from "../common";

export const portfolioMetric = pgTable("portfolio_metric", {
	id: uuid().defaultRandom().notNull().primaryKey(),
	portfolio_id: uuid()
		.references(() => portfolios.id, { onDelete: "cascade" })
		.notNull(),
	view: integer().default(1),
	...timestamps,
});

export const portfolioMetricRelation = relations(
	portfolioMetric,
	({ one }) => ({
		portfolio: one(portfolios, {
			fields: [portfolioMetric.portfolio_id],
			references: [portfolios.id],
		}),
	}),
);
