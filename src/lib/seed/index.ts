import { db } from "@/lib/db";
import {
  auths,
  permissionFlags,
  resources,
  roles,
  users,
} from "@/lib/db/schema";
import env from "@/lib/env";
import logger from "@/lib/logger";
import { RoleModel } from "@/modules/role/role.model";
import { hashPassword } from "@/util/password";

const baseResources = [
  "User",
  "Role",
  "Resource",
  "Portfolio",
  "Blog",
  "Category",
] as const;

const seedUser = {
  username: "admin",
  email: "admin@example.com",
  password: "12345678",
};

type ResourceName = (typeof baseResources)[number];

function permissionFor(roleName: RoleModel.Enum, resourceName: ResourceName) {
  if (roleName === RoleModel.Enum.Admin) {
    return { read: true, write: true, delete: true };
  }

  const userManagedResources = new Set<ResourceName>([
    "Portfolio",
    "Blog",
    "Category",
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

export async function seedDatabase() {
  await db.transaction(async (tx) => {
    const resourceByName = new Map<
      ResourceName,
      typeof resources.$inferSelect
    >();
    const baseRoles = Object.values(RoleModel.Enum);
    const insertedRoles: RoleModel.Entity[] = [];
    for (const name of baseRoles) {
      const [role] = await tx
        .insert(roles)
        .values({ name })
        .onConflictDoUpdate({
          target: roles.name,
          set: { name },
        })
        .returning();
      insertedRoles.push(role);
    }

    logger.info("Roles seeded", { count: insertedRoles.length });

    for (const name of baseResources) {
      const [resource] = await tx
        .insert(resources)
        .values({ name })
        .onConflictDoUpdate({
          target: resources.name,
          set: { name },
        })
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
          .values({
            role_id: role.id,
            resource_id: resource.id,
            ...permission,
          })
          .onConflictDoUpdate({
            target: [permissionFlags.role_id, permissionFlags.resource_id],
            set: permission,
          });
      }
    }

    logger.info("Permissions seeded", {
      count: baseRoles.length * baseResources.length,
    });

    const adminRole = insertedRoles.find(
      (role) => role.name === RoleModel.Enum.Admin,
    );
    if (!adminRole) throw new Error("Missing seeded Admin role");

    const [user] = await tx
      .insert(users)
      .values({
        username: seedUser.username,
        email: seedUser.email,
        role_id: adminRole.id,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          username: seedUser.username,
          role_id: adminRole.id,
        },
      })
      .returning();

    const passwordHash = await hashPassword(seedUser.password);

    await tx
      .insert(auths)
      .values({
        user_id: user.id,
        password_hash: passwordHash,
      })
      .onConflictDoUpdate({
        target: auths.user_id,
        set: {
          password_hash: passwordHash,
          password_updated_at: new Date().toISOString(),
        },
      });

    logger.info("Seed user ready", {
      email: seedUser.email,
      username: seedUser.username,
    });
  });
}

async function main() {
  try {
    logger.info("Starting database seed");
    await seedDatabase();
    logger.info("Database seed completed");
    process.exit(0);
  } catch (error) {
    logger.error("Database seed failed", error);
    process.exit(1);
  }
}

main();
