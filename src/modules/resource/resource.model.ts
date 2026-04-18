import { BaseModel } from "@/core/model/base.model";
import z from "zod";

export namespace ResourceModel {
  export const EntitySchema = BaseModel.BaseRowSchema.extend({
    name: z.string(),
  });
  export const CreateSchema = EntitySchema.pick({
    name: true,
  });
  export type Entity = z.infer<typeof EntitySchema>;
  export type Create = z.infer<typeof CreateSchema>;
}
