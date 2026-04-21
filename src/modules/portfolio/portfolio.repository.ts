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
  users,
} from "@/lib/db/schema";
import type { PortfolioModel } from "./portfolio.model";

type Client = typeof db | DrizzleTransaction;

export abstract class PortfolioRepository {
  private static buildFilter(
    filter: PortfolioModel.Filter,
    options?: { publishedOnly?: boolean },
  ) {
    const conditions: SQL[] = [];

    if (options?.publishedOnly)
      conditions.push(isNotNull(portfolios.published_at));

    if (filter.published === true) {
      conditions.push(isNotNull(portfolios.published_at));
    }

    if (filter.published === false) {
      conditions.push(isNull(portfolios.published_at));
    }

    if (filter.query) {
      const query = `%${filter.query}%`;
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

    return conditions.length ? conditions : [];
  }

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

  static async paginatePublishedByUsername(
    filter: PortfolioModel.Filter,
    username: string,
  ) {
    const cond = this.buildFilter(filter, { publishedOnly: true });
    const offset = (filter.page - 1) * filter.page_size;
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) return { data: [], total_count: 0 };

    const [total, data] = await Promise.all([
      db
        .select({ count: count() })
        .from(portfolios)
        .where(and(...cond, eq(portfolios.user_id, user.id))),

      db.query.portfolios.findMany({
        where: and(...cond, eq(portfolios.user_id, user.id)),
        with: {
          category_on_portfolios: {
            with: {
              category: true,
            },
          },
        },
        orderBy: [desc(portfolios.published_at), desc(portfolios.created_at)],
        limit: filter.page_size,
        offset,
      }),
    ]);

    return {
      data: data.map(({ category_on_portfolios, ...portfolio }) => ({
        ...portfolio,
        categories: category_on_portfolios.map((item) => item.category),
      })),
      total_count: total[0]?.count ?? 0,
    };
  }

  static async create(
    userId: number,
    payload: Omit<PortfolioModel.Create, "category_ids"> & {
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
    payload: Omit<PortfolioModel.Update, "category_ids">,
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
      .set({ published_at: new Date().toISOString() })
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
