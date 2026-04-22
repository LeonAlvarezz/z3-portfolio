import { z } from "zod";
import { OpenApiResponseSchema } from "@/core/error/response";

/**
 * Common DB timestamp fields.
 *
 * Use `BaseRowSchema` when your DB columns are optional but not nullable.
 * Use `BaseRowNullableSchema` when your DB columns are nullable.

*/
export namespace BaseModel {
  export const BaseRowSchema = z.object({
    id: z.number(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().optional().nullable(),
    deleted_at: z.iso.datetime().optional().nullable(),
  });

  export const BaseRowNullableSchema = BaseRowSchema.extend({
    updated_at: z.iso.datetime().nullable().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  });

  export const HealthCheckSchema = z.object({
    uptime: z.number(),
    message: z.string().default("OK"),
  });

  export const UUIDParamsSchema = z.object({
    id: z.uuid(),
  });

  export const StringListSchema = z.string().array();

  export const CookieSchema = z.object({
    session_token: z.string().optional(),
  });

  export const OpenApi = {
    SimpleSuccessResponse: "SimpleSuccessResponse",
    StringList: "StringList",
  } as const;

  export const OpenApiSchemas = {
    [OpenApi.SimpleSuccessResponse]: OpenApiResponseSchema.simpleSuccess(),
    [OpenApi.StringList]: OpenApiResponseSchema.stringList(),
  };

  export type CookieDto = z.infer<typeof CookieSchema>;
}
