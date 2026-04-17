import { BaseModel } from "@/core/model/base.model";
import z from "zod";

export namespace RoleModel {
  export enum Enum {
    Admin = "Admin",
    User = "User",
  }

  export const EntitySchema = BaseModel.BaseRowSchema.extend({
    name: z.string(),
  });

  export type Entity = z.infer<typeof EntitySchema>;
}
