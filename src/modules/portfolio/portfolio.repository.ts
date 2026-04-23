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
import { getPublicImage } from "@/lib/r2/r2.util";

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
    const portfolio = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.id, id), eq(portfolios.user_id, userId)),
      with: {
        cover_asset: true,
        gallery: {
          with: {
            asset: true,
          },
        },
        category_on_portfolios: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!portfolio) return null;

    const { category_on_portfolios, cover_asset, gallery, ...rest } = portfolio;
    return {
      ...rest,
      cover_url: cover_asset ? getPublicImage(cover_asset.storage_key) : null,
      gallery: gallery.map((g) => getPublicImage(g.asset.storage_key)),
      categories: category_on_portfolios.map((item) => item.category),
    };
  }

  static async findPublishedBySlug(
    slug: string,
  ): Promise<PortfolioModel.Detail | null> {
    const portfolio = await db.query.portfolios.findFirst({
      where: and(eq(portfolios.slug, slug), isNotNull(portfolios.published_at)),
      with: {
        cover_asset: true,
        gallery: {
          with: {
            asset: true,
          },
        },
        category_on_portfolios: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!portfolio) return null;

    const { category_on_portfolios, cover_asset, gallery, ...rest } = portfolio;
    return {
      ...rest,
      cover_url: cover_asset ? getPublicImage(cover_asset.storage_key) : null,
      gallery: gallery.map((g) => getPublicImage(g.asset.storage_key)),
      categories: category_on_portfolios.map((item) => item.category),
    };
  }

  static async findAllPublishedSlug(user_id: number) {
    const result = await db.query.portfolios.findMany({
      columns: {
        slug: true,
      },
      where: eq(portfolios.user_id, user_id),
    });
    return result.map((portfolio) => portfolio.slug);
  }

  static async paginatePublishedByUser(
    filter: PortfolioModel.Filter,
    user_id: number,
  ) {
    const cond = this.buildFilter(filter, { publishedOnly: true });
    const offset = (filter.page - 1) * filter.page_size;

    const [total, data] = await Promise.all([
      db
        .select({ count: count() })
        .from(portfolios)
        .leftJoin(users, eq(portfolios.user_id, user_id))
        .where(and(...cond, eq(users.id, user_id))),

      db.query.portfolios.findMany({
        where: and(...cond, eq(portfolios.user_id, user_id)),
        with: {
          category_on_portfolios: {
            with: {
              category: true,
            },
          },
          cover_asset: true,
        },
        orderBy: [desc(portfolios.published_at), desc(portfolios.created_at)],
        limit: filter.page_size,
        offset,
      }),
    ]);

    return {
      data: data.map(
        ({ category_on_portfolios, cover_asset, ...portfolio }) => ({
          ...portfolio,
          categories: category_on_portfolios.map((item) => item.category),
          cover_url: cover_asset
            ? getPublicImage(cover_asset.storage_key)
            : null,
        }),
      ),
      total_count: total[0]?.count ?? 0,
    };
  }

  static async create(
    user_id: number,
    payload: PortfolioModel.Create,
    tx: Client = db,
  ) {
    const [portfolio] = await tx
      .insert(portfolios)
      .values({
        ...payload,
        user_id,
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

  static async findOwnedCategories(categoryIds: number[], userId: number) {
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
    categoryIds: number[],
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
