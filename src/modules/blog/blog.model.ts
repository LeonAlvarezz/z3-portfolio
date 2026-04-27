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

  export const DetailFieldsSchema = z.object({});

  const CategoryFieldsSchema = z.object({
    categories: CategoryModel.EntitySchema.array().optional(),
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
    ListItem: "BlogListItem",
    Detail: "BlogDetail",
    Params: "BlogParams",
    SlugParams: "BlogSlugParams",
    Create: "BlogCreate",
    Update: "BlogUpdate",
    AssignCategories: "BlogAssignCategories",
    ListItemResponse: "BlogListItemResponse",
    DetailResponse: "BlogDetailResponse",
    ListPageResponse: "BlogListPageResponse",
    EntityResponse: "BlogResponse",
    Filter: "BlogFilter",
  } as const;

  export const OpenApiSchemas = {
    [OpenApi.Entity]: EntitySchema,
    [OpenApi.ListItem]: ListItemSchema,
    [OpenApi.Detail]: DetailSchema,
    [OpenApi.Params]: BaseModel.UUIDParamsSchema,
    [OpenApi.SlugParams]: SlugParamsSchema,
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
