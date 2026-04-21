import z from "zod";
import { PAGINATION_LIMIT } from "@/constant/app";
import { OpenApiResponseSchema } from "@/core/error/response";
import { CategoryModel } from "../category/category.model";

const BooleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export namespace PortfolioModel {
  export const EntitySchema = z.object({
    id: z.uuid(),
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    gallery: z.string().array().nullable().optional(),
    content: z.unknown().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    github_link: z.string().nullable().optional(),
    preview_link: z.string().nullable().optional(),
    user_id: z.number().int().positive(),
    published_at: z.iso.datetime().nullable().optional(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().nullable().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  });

  export const EntityWithCategorySchema = EntitySchema.extend({
    categories: CategoryModel.EntitySchema.array().optional(),
  });

  export const CreateSchema = z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    slug: z.string().trim().min(1).optional(),
    gallery: z.string().array().optional(),
    content: z.unknown().optional(),
    cover_url: z.string().trim().min(1).optional(),
    github_link: z.string().trim().min(1).optional(),
    preview_link: z.string().trim().min(1).optional(),
    category_ids: z.uuid().array().optional(),
  });

  export const UpdateSchema = CreateSchema.partial();

  export const AssignCategoriesSchema = z.object({
    category_ids: z.uuid().array(),
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
    category_id: z.uuid().optional(),
    published: BooleanQuerySchema.optional(),
  });

  export const OpenApi = {
    Entity: "Portfolio",
    EntityWithCategory: "PortfolioWithCategory",
    Create: "PortfolioCreate",
    Update: "PortfolioUpdate",
    AssignCategories: "PortfolioAssignCategories",
    Response: "PortfolioResponse",
    ListResponse: "PortfolioListResponse",
    SimpleSuccessResponse: "SimpleSuccessResponse",
    Filter: "PortfolioFilter",
  } as const;

  export const OpenApiSchemas = {
    [OpenApi.Entity]: EntitySchema,
    [OpenApi.EntityWithCategory]: EntityWithCategorySchema,
    [OpenApi.Create]: CreateSchema,
    [OpenApi.Update]: UpdateSchema,
    [OpenApi.AssignCategories]: AssignCategoriesSchema,
    [OpenApi.Response]: OpenApiResponseSchema.success(EntitySchema),
    [OpenApi.ListResponse]: OpenApiResponseSchema.page(
      EntityWithCategorySchema,
    ),
    [OpenApi.SimpleSuccessResponse]: OpenApiResponseSchema.simpleSuccess(),
    [OpenApi.Filter]: FilterSchema,
  };

  export type Entity = z.infer<typeof EntitySchema>;
  export type Create = z.infer<typeof CreateSchema>;
  export type Update = z.infer<typeof UpdateSchema>;
  export type AssignCategories = z.infer<typeof AssignCategoriesSchema>;
  export type Filter = z.infer<typeof FilterSchema>;
}
