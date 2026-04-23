import z from "zod";

export namespace CategoryModel {
  export enum ColorEnum {
    RED = "RED",
    VIOLET = "VIOLET",
    GREEN = "GREEN",
    PURPLE = "PURPLE",
    YELLOW = "YELLOW",
    ORANGE = "ORANGE",
    GRAY = "GRAY",
    TEAL = "TEAL",
    INDIGO = "INDIGO",
    BLUE = "BLUE",
  }

  export const EntitySchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    color: z.enum(ColorEnum).nullable().optional(),
    user_id: z.number().int().positive(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().nullable().optional(),
    deleted_at: z.iso.datetime().nullable().optional(),
  });

  export const CreateSchema = z.object({
    name: z.string().trim().min(1),
    color: z.enum(ColorEnum).optional(),
  });

  export const UpdateSchema = CreateSchema.partial();

  export const ParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
  });

  export type CreateCategoryDto = z.infer<typeof CreateSchema>;
  export type UpdateCategoryDto = z.infer<typeof UpdateSchema>;
}
