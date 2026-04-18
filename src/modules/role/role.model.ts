import { BaseModel } from "@/core/model/base.model";
import { PermissionFlagModel } from "@/modules/permission-flag/permission-flag.model";
import z from "zod";

export namespace RoleModel {
  export enum Enum {
    Admin = "Admin",
    User = "User",
  }

  export const EntitySchema = BaseModel.BaseRowSchema.extend({
    name: z.string(),
  });

  export const CreateSchema = EntitySchema.pick({
    name: true,
  });

  export const CreateWithPermissionSchema = EntitySchema.pick({
    name: true,
  }).extend({
    permissions: z.array(PermissionFlagModel.CreateSchema),
  });

  export const UpdateWithPermissionSchema =
    CreateWithPermissionSchema.partial();

  export const CheckSchema = z.object({
    role_id: z.number(),
    resource: z.string().min(1, { message: "Resource Name is Required" }),
  });

  export type Create = z.infer<typeof CreateSchema>;
  export type CreateWithPermission = z.infer<typeof CreateWithPermissionSchema>;
  export type UpdateWithPermission = z.infer<typeof UpdateWithPermissionSchema>;

  export type Check = z.infer<typeof CheckSchema>;

  export type Entity = z.infer<typeof EntitySchema>;
}
