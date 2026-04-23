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
  blogMetric,
  blogs,
  categories,
  categoryOnBlogs,
  users,
} from "@/lib/db/schema";
import type { BlogModel } from "./blog.model";
import { getPublicImage } from "@/lib/r2/r2.util";

type Client = typeof db | DrizzleTransaction;

export abstract class BlogRepository {
  private static buildFilter(
    filter: BlogModel.Filter,
    options?: { publishedOnly?: boolean },
  ) {
    const conditions: SQL[] = [];

    if (options?.publishedOnly) conditions.push(isNotNull(blogs.published_at));

    if (filter.published === true) {
      conditions.push(isNotNull(blogs.published_at));
    }

    if (filter.published === false) {
      conditions.push(isNull(blogs.published_at));
    }

    if (filter.query) {
      const query = `%${filter.query}%`;
      const textSearch = or(
        ilike(blogs.title, query),
        ilike(blogs.description, query),
        ilike(blogs.slug, query),
      );
      if (textSearch) conditions.push(textSearch);
    }

    if (filter.category_id) {
      conditions.push(
        sql`${blogs.id} in (
				select ${categoryOnBlogs.blog_id}
				from ${categoryOnBlogs}
				where ${categoryOnBlogs.category_id} = ${filter.category_id}
			)`,
      );
    }

    return conditions;
  }

  static async findBySlug(slug: string) {
    const [blog] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1);

    return blog ?? null;
  }

  static async findAllPublishedSlug(user_id: number) {
    const result = await db.query.blogs.findMany({
      columns: {
        slug: true,
      },
      where: eq(blogs.user_id, user_id),
    });
    return result.map((blog) => blog.slug);
  }

  static async findOwnedById(id: string, userId: number) {
    const [blog] = await db
      .select()
      .from(blogs)
      .where(and(eq(blogs.id, id), eq(blogs.user_id, userId)))
      .limit(1);

    return blog ?? null;
  }

  static async findPublishedBySlug(slug: string) {
    const blogResult = await db.query.blogs.findFirst({
      where: and(eq(blogs.slug, slug), isNotNull(blogs.published_at)),
      with: {
        cover_asset: true,
        category_on_blogs: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!blogResult) return null;

    const { category_on_blogs, cover_asset, ...rest } = blogResult;
    return {
      ...rest,
      cover_url: cover_asset ? getPublicImage(cover_asset.storage_key) : null,
      categories: category_on_blogs.map((item) => item.category),
    };
  }

  // static async paginateByUser(userId: number, filter: BlogModel.BlogFilterDto) {
  //   const where = applyBlogFilter(userId, filter);
  //   const offset = (filter.page - 1) * filter.page_size;

  //   const [total] = await db
  //     .select({ count: count() })
  //     .from(blogs)
  //     .where(where);

  //   const data = await db
  //     .select()
  //     .from(blogs)
  //     .where(where)
  //     .orderBy(desc(blogs.created_at))
  //     .limit(filter.page_size)
  //     .offset(offset);

  //   return { data, total_count: total.count };
  // }

  // static async paginatePublished(filter: BlogModel.BlogFilterDto) {
  //   const where = applyBlogFilter(null, filter, { publishedOnly: true });
  //   const offset = (filter.page - 1) * filter.page_size;

  //   const [total] = await db
  //     .select({ count: count() })
  //     .from(blogs)
  //     .where(where);

  //   const data = await db
  //     .select()
  //     .from(blogs)
  //     .where(where)
  //     .orderBy(desc(blogs.published_at), desc(blogs.created_at))
  //     .limit(filter.page_size)
  //     .offset(offset);

  //   return { data, total_count: total.count };
  // }
  //
  //
  //
  static async paginatePublishedByUsername(
    filter: BlogModel.Filter,
    user_id: number,
  ) {
    const cond = this.buildFilter(filter, { publishedOnly: true });
    const offset = (filter.page - 1) * filter.page_size;

    const [total, data] = await Promise.all([
      db
        .select({ count: count() })
        .from(blogs)
        .where(and(...cond, eq(blogs.user_id, user_id))),

      db.query.blogs.findMany({
        where: and(...cond, eq(blogs.user_id, user_id)),
        with: {
          cover_asset: true,
          category_on_blogs: {
            with: {
              category: true,
            },
          },
        },
        orderBy: [desc(blogs.published_at), desc(blogs.created_at)],
        limit: filter.page_size,
        offset,
      }),
    ]);

    return {
      data: data.map(({ category_on_blogs, cover_asset, ...blog }) => ({
        ...blog,
        categories: category_on_blogs.map((item) => item.category),
      })),
      total_count: total[0]?.count ?? 0,
    };
  }

  static async create(
    user_id: number,
    payload: BlogModel.Create,
    tx: Client = db,
  ) {
    const [blog] = await tx
      .insert(blogs)
      .values({
        ...payload,
        user_id: user_id,
      })
      .returning();

    return blog;
  }

  static async update(
    id: string,
    userId: number,
    payload: Omit<BlogModel.Update, "category_ids">,
    tx: Client = db,
  ) {
    const [blog] = await tx
      .update(blogs)
      .set(payload)
      .where(and(eq(blogs.id, id), eq(blogs.user_id, userId)))
      .returning();

    return blog ?? null;
  }

  static async delete(id: string, userId: number) {
    const [blog] = await db
      .delete(blogs)
      .where(and(eq(blogs.id, id), eq(blogs.user_id, userId)))
      .returning();

    return blog ?? null;
  }

  static async publish(id: string, userId: number) {
    const now = new Date();
    const [blog] = await db
      .update(blogs)
      .set({ published_at: now.toISOString() })
      .where(and(eq(blogs.id, id), eq(blogs.user_id, userId)))
      .returning();

    return blog ?? null;
  }

  static async unpublish(id: string, userId: number) {
    const [blog] = await db
      .update(blogs)
      .set({ published_at: null })
      .where(and(eq(blogs.id, id), eq(blogs.user_id, userId)))
      .returning();

    return blog ?? null;
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
    blogId: string,
    categoryIds: number[],
    tx: Client = db,
  ) {
    await tx.delete(categoryOnBlogs).where(eq(categoryOnBlogs.blog_id, blogId));

    if (!categoryIds.length) return;

    await tx.insert(categoryOnBlogs).values(
      categoryIds.map((categoryId) => ({
        blog_id: blogId,
        category_id: categoryId,
      })),
    );
  }

  static async increaseView(blogId: string) {
    const [metric] = await db
      .insert(blogMetric)
      .values({ blog_id: blogId })
      .returning();

    return metric;
  }
}
