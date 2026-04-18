import z from "zod";
import { CategoryColorEnum } from "./model/category.enum";

export namespace CategoryModel {
	export const CategorySchema = z.object({
		id: z.uuid(),
		name: z.string().min(1),
		color: z.enum(CategoryColorEnum).nullable().optional(),
		user_id: z.number().int().positive(),
		created_at: z.iso.datetime(),
		updated_at: z.iso.datetime().nullable().optional(),
		deleted_at: z.iso.datetime().nullable().optional(),
	});

	export const CreateCategorySchema = z.object({
		name: z.string().trim().min(1),
		color: z.enum(CategoryColorEnum).optional(),
	});

	export const UpdateCategorySchema = CreateCategorySchema.partial();

	export const CategoryParamsSchema = z.object({
		id: z.uuid(),
	});

	export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
	export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
}
