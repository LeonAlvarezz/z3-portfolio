import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNotNull,
	isNull,
	or,
	sql,
	type SQL,
} from "drizzle-orm";
import { db, type DrizzleTransaction } from "@/lib/db";
import {
	categories,
	categoryOnPortfolios,
	portfolioMetric,
	portfolios,
} from "@/lib/db/schema";
import type { PortfolioModel } from "./portfolio.model";

type Client = typeof db | DrizzleTransaction;

function applyPortfolioFilter(
	userId: number | null,
	filter: PortfolioModel.PortfolioFilterDto,
	options?: { publishedOnly?: boolean },
) {
	const conditions: SQL[] = [];

	if (userId) conditions.push(eq(portfolios.user_id, userId));
	if (options?.publishedOnly)
		conditions.push(isNotNull(portfolios.published_at));

	if (filter.published === true) {
		conditions.push(isNotNull(portfolios.published_at));
	}

	if (filter.published === false) {
		conditions.push(isNull(portfolios.published_at));
	}

	if (filter.q) {
		const query = `%${filter.q}%`;
		const textSearch = or(
			ilike(portfolios.title, query),
			ilike(portfolios.description, query),
			ilike(portfolios.slug, query),
		);
		if (textSearch) conditions.push(textSearch);
	}

	if (filter.category_id) {
		conditions.push(
			sql`${portfolios.id} in (
				select ${categoryOnPortfolios.portfolio_id}
				from ${categoryOnPortfolios}
				where ${categoryOnPortfolios.category_id} = ${filter.category_id}
			)`,
		);
	}

	return conditions.length ? and(...conditions) : undefined;
}

export abstract class PortfolioRepository {
	static async findBySlug(slug: string) {
		const [portfolio] = await db
			.select()
			.from(portfolios)
			.where(eq(portfolios.slug, slug))
			.limit(1);

		return portfolio ?? null;
	}

	static async findOwnedById(id: string, userId: number) {
		const [portfolio] = await db
			.select()
			.from(portfolios)
			.where(and(eq(portfolios.id, id), eq(portfolios.user_id, userId)))
			.limit(1);

		return portfolio ?? null;
	}

	static async findPublishedBySlug(slug: string) {
		const [portfolio] = await db
			.select()
			.from(portfolios)
			.where(and(eq(portfolios.slug, slug), isNotNull(portfolios.published_at)))
			.limit(1);

		return portfolio ?? null;
	}

	static async paginateByUser(
		userId: number,
		filter: PortfolioModel.PortfolioFilterDto,
	) {
		const where = applyPortfolioFilter(userId, filter);
		const offset = (filter.page - 1) * filter.page_size;

		const [total] = await db
			.select({ count: count() })
			.from(portfolios)
			.where(where);

		const data = await db
			.select()
			.from(portfolios)
			.where(where)
			.orderBy(desc(portfolios.created_at))
			.limit(filter.page_size)
			.offset(offset);

		return { data, total_count: total.count };
	}

	static async paginatePublished(filter: PortfolioModel.PortfolioFilterDto) {
		const where = applyPortfolioFilter(null, filter, { publishedOnly: true });
		const offset = (filter.page - 1) * filter.page_size;

		const [total] = await db
			.select({ count: count() })
			.from(portfolios)
			.where(where);

		const data = await db
			.select()
			.from(portfolios)
			.where(where)
			.orderBy(desc(portfolios.published_at), desc(portfolios.created_at))
			.limit(filter.page_size)
			.offset(offset);

		return { data, total_count: total.count };
	}

	static async create(
		userId: number,
		payload: Omit<PortfolioModel.CreatePortfolioDto, "category_ids"> & {
			slug: string;
		},
		tx: Client = db,
	) {
		const [portfolio] = await tx
			.insert(portfolios)
			.values({
				title: payload.title,
				description: payload.description,
				slug: payload.slug,
				gallery: payload.gallery,
				content: payload.content,
				cover_url: payload.cover_url,
				github_link: payload.github_link,
				preview_link: payload.preview_link,
				user_id: userId,
			})
			.returning();

		return portfolio;
	}

	static async update(
		id: string,
		userId: number,
		payload: Omit<PortfolioModel.UpdatePortfolioDto, "category_ids">,
		tx: Client = db,
	) {
		const [portfolio] = await tx
			.update(portfolios)
			.set(payload)
			.where(and(eq(portfolios.id, id), eq(portfolios.user_id, userId)))
			.returning();

		return portfolio ?? null;
	}

	static async delete(id: string, userId: number) {
		const [portfolio] = await db
			.delete(portfolios)
			.where(and(eq(portfolios.id, id), eq(portfolios.user_id, userId)))
			.returning();

		return portfolio ?? null;
	}

	static async publish(id: string, userId: number) {
		const [portfolio] = await db
			.update(portfolios)
			.set({ published_at: new Date() })
			.where(and(eq(portfolios.id, id), eq(portfolios.user_id, userId)))
			.returning();

		return portfolio ?? null;
	}

	static async unpublish(id: string, userId: number) {
		const [portfolio] = await db
			.update(portfolios)
			.set({ published_at: null })
			.where(and(eq(portfolios.id, id), eq(portfolios.user_id, userId)))
			.returning();

		return portfolio ?? null;
	}

	static async findOwnedCategories(categoryIds: string[], userId: number) {
		if (!categoryIds.length) return [];

		return await db
			.select({ id: categories.id })
			.from(categories)
			.where(
				and(
					inArray(categories.id, categoryIds),
					eq(categories.user_id, userId),
				),
			)
			.orderBy(asc(categories.name));
	}

	static async replaceCategories(
		portfolioId: string,
		categoryIds: string[],
		tx: Client = db,
	) {
		await tx
			.delete(categoryOnPortfolios)
			.where(eq(categoryOnPortfolios.portfolio_id, portfolioId));

		if (!categoryIds.length) return;

		await tx.insert(categoryOnPortfolios).values(
			categoryIds.map((categoryId) => ({
				portfolio_id: portfolioId,
				category_id: categoryId,
			})),
		);
	}

	static async increaseView(portfolioId: string) {
		const [metric] = await db
			.insert(portfolioMetric)
			.values({ portfolio_id: portfolioId })
			.returning();

		return metric;
	}
}
