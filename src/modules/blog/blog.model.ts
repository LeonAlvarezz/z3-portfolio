import z from "zod";
import { PAGINATION_LIMIT } from "@/constant/app";

const BooleanQuerySchema = z.preprocess((value) => {
	if (value === "true") return true;
	if (value === "false") return false;
	return value;
}, z.boolean());

export namespace BlogModel {
	export const BlogSchema = z.object({
		id: z.uuid(),
		title: z.string(),
		description: z.string(),
		slug: z.string(),
		content: z.unknown().nullable().optional(),
		cover_url: z.string().nullable().optional(),
		user_id: z.number().int().positive(),
		published_at: z.date().nullable().optional(),
		created_at: z.iso.datetime(),
		updated_at: z.iso.datetime().nullable().optional(),
		deleted_at: z.iso.datetime().nullable().optional(),
	});

	export const CreateBlogSchema = z.object({
		title: z.string().trim().min(1),
		description: z.string().trim().min(1),
		slug: z.string().trim().min(1).optional(),
		content: z.unknown().optional(),
		cover_url: z.string().trim().min(1).optional(),
		category_ids: z.uuid().array().optional(),
	});

	export const UpdateBlogSchema = CreateBlogSchema.partial();

	export const AssignCategoriesSchema = z.object({
		category_ids: z.uuid().array(),
	});

	export const BlogParamsSchema = z.object({
		id: z.uuid(),
	});

	export const BlogSlugParamsSchema = z.object({
		slug: z.string().trim().min(1),
	});

	export const BlogFilterSchema = z.object({
		page: z.coerce.number().int().min(1).default(1),
		page_size: z.coerce
			.number()
			.int()
			.min(1)
			.max(100)
			.default(PAGINATION_LIMIT),
		q: z.string().trim().optional(),
		category_id: z.uuid().optional(),
		published: BooleanQuerySchema.optional(),
	});

	export type CreateBlogDto = z.infer<typeof CreateBlogSchema>;
	export type UpdateBlogDto = z.infer<typeof UpdateBlogSchema>;
	export type AssignCategoriesDto = z.infer<typeof AssignCategoriesSchema>;
	export type BlogFilterDto = z.infer<typeof BlogFilterSchema>;
}
