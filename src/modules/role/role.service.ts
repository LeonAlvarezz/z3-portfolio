import { db } from "@/lib/db";
import { RoleModel } from "./role.model";
import { RoleRepository } from "./role.repository";
import { PermissionFlagRepository } from "../permission-flag/permission-flag.repository";
import { ForbiddenException } from "@/core/error";
import { ResourceRepository } from "../resource/resource.repository";

export class RoleService {
  public findById(id: number) {
    return RoleRepository.findById(id);
  }

  public async create(payload: RoleModel.CreateWithPermission) {
    return db.transaction(async (tx) => {
      const role = await RoleRepository.create(payload, tx);

      const permissionPromises = payload.permissions.map((permission) =>
        PermissionFlagRepository.create(role.id, permission, tx),
      );

      await Promise.all(permissionPromises);

      return role;
    });
  }
  public async update(
    role_id: number,
    payload: RoleModel.UpdateWithPermission,
  ) {
    return await db.transaction(async (tx) => {
      const role = await RoleRepository.findById(role_id, tx);
      if (!role) {
        throw new ForbiddenException({ message: "Role not accessible" });
      }
      const permissionPromises = payload.permissions?.map((permission) =>
        PermissionFlagRepository.upsert(role.id, permission, tx),
      );
      await Promise.all(permissionPromises ?? []);

      return role;
    });
  }

  public async delete(id: number) {
    return RoleRepository.delete(id);
  }

  public async check(payload: RoleModel.Check) {
    const role = await RoleRepository.findById(payload.role_id);
    const resource = await ResourceRepository.findByName(payload.resource);
    if (!role) {
      throw new ForbiddenException({ message: "Role not accessible" });
    }
    const permission = role.permission_flags.find(
      (p) => p.resource_id === resource?.id,
    );
    if (!permission) {
      throw new ForbiddenException({ message: "You have no permission" });
    }

    const actionAllowed = permission["read"];
    if (!actionAllowed) {
      throw new ForbiddenException({ message: "You have no permission" });
    }
    return role;
  }
}
