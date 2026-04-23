import z from "zod";
import { OpenApiResponseSchema } from "@/core/error/response";

export namespace MediaModel {
  export const EntitySchema = z.object({
    id: z.number().int().positive(),
    storage_key: z.string(),
    file_name: z.string(),
    mime_type: z.string(),
    size: z.number().int(),
    user_id: z.number().int().positive(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().nullable().optional(),
  });

  export const StorageKeySchema = EntitySchema.pick({
    storage_key: true,
  });

  export const PresignedDownloadResponseSchema = z.object({
    download_url: z.url(),
  });

  export const CreateSchema = EntitySchema.pick({
    storage_key: true,
    file_name: true,
    mime_type: true,
    size: true,
  });

  export const ParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
  });

  export const OpenApi = {
    PresignedDownloadResponse: "MediaPresignedDownloadResponse",
    Entity: "Media",
  } as const;

  export const OpenApiSchemas = {
    [OpenApi.PresignedDownloadResponse]: OpenApiResponseSchema.success(
      PresignedDownloadResponseSchema,
    ),
    [OpenApi.Entity]: OpenApiResponseSchema.success(EntitySchema),
  };

  export type Create = z.infer<typeof CreateSchema>;
}
