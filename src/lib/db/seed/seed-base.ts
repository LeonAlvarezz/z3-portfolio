import { db, DrizzleTransaction } from "@/lib/db";
import { permissionFlags, resources, roles } from "@/lib/db/schema";
import logger from "@/lib/logger";
import { RoleModel } from "@/modules/role/role.model";

export const baseResources = [
  "User",
  "Role",
  "Resource",
  "Portfolio",
  "Blog",
  "Category",
  "Media",
] as const;

export type ResourceName = (typeof baseResources)[number];

export function permissionFor(
  roleName: RoleModel.Enum,
  resourceName: ResourceName,
) {
  if (roleName === RoleModel.Enum.Admin) {
    return { read: true, write: true, delete: true };
  }

  const userManagedResources = new Set<ResourceName>([
    "Portfolio",
    "Blog",
    "Category",
    "Media",
  ]);

  if (userManagedResources.has(resourceName)) {
    return { read: true, write: true, delete: true };
  }

  return {
    read: resourceName === "User",
    write: false,
    delete: false,
  };
}

export async function seedBase(tx: DrizzleTransaction) {
  const resourceByName = new Map<ResourceName, typeof resources.$inferSelect>();
  const baseRoles = Object.values(RoleModel.Enum);
  const insertedRoles: RoleModel.Entity[] = [];

  for (const name of baseRoles) {
    const [role] = await tx
      .insert(roles)
      .values({ name })
      .onConflictDoUpdate({ target: roles.name, set: { name } })
      .returning();
    insertedRoles.push(role);
  }
  logger.info("Roles seeded", { count: insertedRoles.length });

  for (const name of baseResources) {
    const [resource] = await tx
      .insert(resources)
      .values({ name })
      .onConflictDoUpdate({ target: resources.name, set: { name } })
      .returning();
    resourceByName.set(name, resource);
  }
  logger.info("Resources seeded", { count: resourceByName.size });

  for (const role of insertedRoles) {
    for (const resourceName of baseResources) {
      const resource = resourceByName.get(resourceName);
      if (!resource)
        throw new Error(`Missing seeded resource: ${resourceName}`);

      const permission = permissionFor(
        role.name as RoleModel.Enum,
        resourceName,
      );

      await tx
        .insert(permissionFlags)
        .values({ role_id: role.id, resource_id: resource.id, ...permission })
        .onConflictDoUpdate({
          target: [permissionFlags.role_id, permissionFlags.resource_id],
          set: permission,
        });
    }
  }
  logger.info("Permissions seeded", {
    count: baseRoles.length * baseResources.length,
  });

  const adminRole = insertedRoles.find((r) => r.name === RoleModel.Enum.Admin);
  if (!adminRole) throw new Error("Missing seeded Admin role");

  return { insertedRoles, adminRole };
}
