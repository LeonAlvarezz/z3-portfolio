import z from "zod";
import { PAGINATION_LIMIT } from "@/constant/app";
import { OpenApiResponseSchema } from "@/core/error/response";
import { CategoryModel } from "../category/category.model";
import { BaseModel } from "@/core/model/base.model";

const BooleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export namespace BlogModel {
  export const EntitySchema = z.object({
    id: z.uuid(),
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    content: z.unknown().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    user_id: z.number().int().positive(),
    published_at: z.iso.datetime().nullable().optional(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().nullable().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  });

  export const EntityWithCategorySchema = EntitySchema.extend({
    categories: CategoryModel.EntitySchema.array().optional(),
  });

  export const CreateSchema = EntitySchema.pick({
    title: true,
    description: true,
    slug: true,
    content: true,
  }).extend({
    category_ids: z.number().int().positive().array().optional(),
  });

  export const UpdateSchema = CreateSchema.partial();

  export const AssignCategoriesSchema = z.object({
    category_ids: z.number().int().positive().array(),
  });

  export const ParamsSchema = z.object({
    id: z.uuid(),
  });

  export const SlugParamsSchema = z.object({
    slug: z.string().trim().min(1),
  });

  export const FilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(PAGINATION_LIMIT),
    query: z.string().trim().optional(),
    category_id: z.coerce.number().int().positive().optional(),
    published: BooleanQuerySchema.optional(),
  });

  export const OpenApi = {
    Entity: "Blog",
    EntityWithCategory: "BlogWithCategory",
    Params: "BlogParams",
    SlugParams: "BlogSlugParams",
    Create: "BlogCreate",
    Update: "BlogUpdate",
    AssignCategories: "BlogAssignCategories",
    Response: "BlogResponse",
    ListResponse: "BlogListResponse",
    Filter: "BlogFilter",
  } as const;

  export const OpenApiSchemas = {
    [OpenApi.Entity]: EntitySchema,
    [OpenApi.EntityWithCategory]: EntityWithCategorySchema,
    [OpenApi.Params]: BaseModel.UUIDParamsSchema,
    [OpenApi.SlugParams]: SlugParamsSchema,
    [OpenApi.Create]: CreateSchema,
    [OpenApi.Update]: UpdateSchema,
    [OpenApi.AssignCategories]: AssignCategoriesSchema,
    [OpenApi.Response]: OpenApiResponseSchema.success(EntitySchema),
    [OpenApi.ListResponse]: OpenApiResponseSchema.page(
      EntityWithCategorySchema,
    ),
    [OpenApi.Filter]: FilterSchema,
  };

  export type Create = z.infer<typeof CreateSchema>;
  export type Update = z.infer<typeof UpdateSchema>;
  export type AssignCategories = z.infer<typeof AssignCategoriesSchema>;
  export type Filter = z.infer<typeof FilterSchema>;
}
