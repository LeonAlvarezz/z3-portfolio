import { z } from "zod";

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

  export const CookieSchema = z.object({
    session_token: z.string().optional(),
  });

  export type CookieDto = z.infer<typeof CookieSchema>;
}
