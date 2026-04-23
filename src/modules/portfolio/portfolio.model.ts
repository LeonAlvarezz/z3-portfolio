import z from "zod";
import { PAGINATION_LIMIT } from "@/constant/app";
import { OpenApiResponseSchema } from "@/core/error/response";
import { CategoryModel } from "../category/category.model";
import { MediaModel } from "../media/media.model";

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
    content: z.unknown().nullable().optional(),
    github_link: z.string().nullable().optional(),
    preview_link: z.string().nullable().optional(),
    user_id: z.number().int().positive(),
    cover_asset_id: z.number().int().nullable().optional(),
    published_at: z.iso.datetime().nullable().optional(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().nullable().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  });

  export const ListItemFieldsSchema = z.object({
    categories: CategoryModel.EntitySchema.array().optional(),
    cover_url: z.string().nullable(),
  });

  export const DetailFieldsSchema = z.object({
    gallery: z.string().array().nullable(),
  });

  const CategoryFieldsSchema = z.object({
    categories: CategoryModel.EntitySchema.array().optional(),
  });

  const GalleryFieldsSchema = z.object({
    gallery: z.string().array().nullable(),
  });

  const CoverUrlFieldsSchema = z.object({
    cover_url: z.string().nullable(),
  });

  export const ListItemSchema = EntitySchema.extend({
    ...CoverUrlFieldsSchema.shape,
    ...CategoryFieldsSchema.shape,
  });

  export const DetailSchema = EntitySchema.extend({
    ...CategoryFieldsSchema.shape,
    ...CoverUrlFieldsSchema.shape,
    ...GalleryFieldsSchema.shape,
  });

  export const CreateSchema = EntitySchema.pick({
    title: true,
    description: true,
    slug: true,
    content: true,
    github_link: true,
    preview_link: true,
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
    Entity: "Portfolio",
    ListItem: "PortfolioListItem",
    Detail: "PortfolioDetail",
    Create: "PortfolioCreate",
    Update: "PortfolioUpdate",
    AssignCategories: "PortfolioAssignCategories",
    ListItemResponse: "PortfolioListItemResponse",
    DetailResponse: "PortfolioDetailResponse",
    ListPageResponse: "PortfolioResponse",
    EntityResponse: "PortfolioListPageResponse",
    Filter: "PortfolioFilter",
  } as const;

  export const OpenApiSchemas = {
    [OpenApi.Entity]: EntitySchema,
    [OpenApi.ListItem]: ListItemSchema,
    [OpenApi.Detail]: DetailSchema,
    [OpenApi.Create]: CreateSchema,
    [OpenApi.Update]: UpdateSchema,
    [OpenApi.AssignCategories]: AssignCategoriesSchema,
    [OpenApi.EntityResponse]: OpenApiResponseSchema.success(EntitySchema),
    [OpenApi.ListItemResponse]: OpenApiResponseSchema.success(ListItemSchema),
    [OpenApi.DetailResponse]: OpenApiResponseSchema.success(DetailSchema),
    [OpenApi.ListPageResponse]: OpenApiResponseSchema.page(ListItemSchema),
    [OpenApi.Filter]: FilterSchema,
  };

  export type Entity = z.infer<typeof EntitySchema>;
  export type ListItem = z.infer<typeof ListItemSchema>;
  export type Detail = z.infer<typeof DetailSchema>;
  export type Create = z.infer<typeof CreateSchema>;
  export type Update = z.infer<typeof UpdateSchema>;
  export type AssignCategories = z.infer<typeof AssignCategoriesSchema>;
  export type Filter = z.infer<typeof FilterSchema>;
}
