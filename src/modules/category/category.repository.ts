import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import type { CategoryModel } from "./category.model";

export abstract class CategoryRepository {
	static async findAllPublic() {
		return await db.select().from(categories).orderBy(asc(categories.name));
	}

	static async findByUser(userId: number) {
		return await db
			.select()
			.from(categories)
			.where(eq(categories.user_id, userId))
			.orderBy(asc(categories.name));
	}

	static async findOwnedById(id: number, userId: number) {
		const [category] = await db
			.select()
			.from(categories)
			.where(and(eq(categories.id, id), eq(categories.user_id, userId)))
			.limit(1);

		return category ?? null;
	}

	static async create(
		userId: number,
		payload: CategoryModel.CreateCategoryDto,
	) {
		const [category] = await db
			.insert(categories)
			.values({
				name: payload.name,
				color: payload.color,
				user_id: userId,
			})
			.returning();

		return category;
	}

	static async update(
		id: number,
		userId: number,
		payload: CategoryModel.UpdateCategoryDto,
	) {
		const [category] = await db
			.update(categories)
			.set(payload)
			.where(and(eq(categories.id, id), eq(categories.user_id, userId)))
			.returning();

		return category ?? null;
	}

	static async delete(id: number, userId: number) {
		const [category] = await db
			.delete(categories)
			.where(and(eq(categories.id, id), eq(categories.user_id, userId)))
			.returning();

		return category ?? null;
	}
}
