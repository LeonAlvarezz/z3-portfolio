import logger from "@/lib/logger";
import { RoleModel } from "@/modules/role/role.model";
import { db, DrizzleTransaction } from "..";
import { roles } from "../schema";

type SeedExecutor = typeof db | DrizzleTransaction;

export async function seedRoles(executor: SeedExecutor) {
  const roleInsert = Object.keys(RoleModel.Enum).map(async (role) => {
    await executor.insert(roles).values({
      name: role,
    });
  });

  await Promise.all(roleInsert);

  logger.info("✅ Roles seeded successfully", {
    count: roleInsert.length,
  });
}
