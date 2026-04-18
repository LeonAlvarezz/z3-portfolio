import { BaseModel } from "@/core/model/base.model";
import z from "zod";

export namespace PermissionFlagModel {
  export const EntitySchema = BaseModel.BaseRowSchema.extend({
    role_id: z.number(),
    resource_id: z.number(),
    read: z.boolean(),
    write: z.boolean(),
    delete: z.boolean(),
  });

  export const CreateSchema = EntitySchema.pick({
    resource_id: true,
    read: true,
    write: true,
    delete: true,
  });
  export type Entity = z.infer<typeof EntitySchema>;
  export type Create = z.infer<typeof CreateSchema>;
}
