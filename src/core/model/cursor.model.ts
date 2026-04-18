import z from "zod";

export namespace CursorModel {
  export const CursorPropsSchema = z.object({
    id: z.number(),
    created_at: z.iso.datetime(),
  });

  export const CursorQuerySchema = z.object({
    cursor: z.string().optional().nullable(),
    page_size: z.coerce.number().default(10),
  });

  export const CursorMetaSchema = z.object({
    next_cursor: z.string().optional().nullable(),
    has_more: z.boolean(),
    page_size: z.coerce.number().default(10),
  });
  export const CursorMetaPropsSchema = CursorPropsSchema.partial().extend({
    total: z.number(),
    page_size: z.coerce.number().default(10),
  });

  export type CursorProps = z.infer<typeof CursorPropsSchema>;
  export type CursorQuery = z.infer<typeof CursorQuerySchema>;
  export type CursorMeta = z.infer<typeof CursorMetaSchema>;
  export type CursorMetaProps = z.infer<typeof CursorMetaPropsSchema>;
}
