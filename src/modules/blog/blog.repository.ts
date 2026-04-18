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
} from "@/lib/db/schema";
import type { BlogModel } from "./blog.model";

type Client = typeof db | DrizzleTransaction;

function applyBlogFilter(
	userId: number | null,
	filter: BlogModel.BlogFilterDto,
	options?: { publishedOnly?: boolean },
) {
	const conditions: SQL[] = [];

	if (userId) conditions.push(eq(blogs.user_id, userId));
	if (options?.publishedOnly) conditions.push(isNotNull(blogs.published_at));

	if (filter.published === true) {
		conditions.push(isNotNull(blogs.published_at));
	}

	if (filter.published === false) {
		conditions.push(isNull(blogs.published_at));
	}

	if (filter.q) {
		const query = `%${filter.q}%`;
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

	return conditions.length ? and(...conditions) : undefined;
}

export abstract class BlogRepository {
	static async findBySlug(slug: string) {
		const [blog] = await db
			.select()
			.from(blogs)
			.where(eq(blogs.slug, slug))
			.limit(1);

		return blog ?? null;
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
		const [blog] = await db
			.select()
			.from(blogs)
			.where(and(eq(blogs.slug, slug), isNotNull(blogs.published_at)))
			.limit(1);

		return blog ?? null;
	}

	static async paginateByUser(userId: number, filter: BlogModel.BlogFilterDto) {
		const where = applyBlogFilter(userId, filter);
		const offset = (filter.page - 1) * filter.page_size;

		const [total] = await db
			.select({ count: count() })
			.from(blogs)
			.where(where);

		const data = await db
			.select()
			.from(blogs)
			.where(where)
			.orderBy(desc(blogs.created_at))
			.limit(filter.page_size)
			.offset(offset);

		return { data, total_count: total.count };
	}

	static async paginatePublished(filter: BlogModel.BlogFilterDto) {
		const where = applyBlogFilter(null, filter, { publishedOnly: true });
		const offset = (filter.page - 1) * filter.page_size;

		const [total] = await db
			.select({ count: count() })
			.from(blogs)
			.where(where);

		const data = await db
			.select()
			.from(blogs)
			.where(where)
			.orderBy(desc(blogs.published_at), desc(blogs.created_at))
			.limit(filter.page_size)
			.offset(offset);

		return { data, total_count: total.count };
	}

	static async create(
		userId: number,
		payload: Omit<BlogModel.CreateBlogDto, "category_ids"> & {
			slug: string;
		},
		tx: Client = db,
	) {
		const [blog] = await tx
			.insert(blogs)
			.values({
				title: payload.title,
				description: payload.description,
				slug: payload.slug,
				content: payload.content,
				cover_url: payload.cover_url,
				user_id: userId,
			})
			.returning();

		return blog;
	}

	static async update(
		id: string,
		userId: number,
		payload: Omit<BlogModel.UpdateBlogDto, "category_ids">,
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
		const [blog] = await db
			.update(blogs)
			.set({ published_at: new Date() })
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
		blogId: string,
		categoryIds: string[],
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
