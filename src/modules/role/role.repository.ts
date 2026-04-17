import { db } from "@/lib/db";
import { RoleModel } from "./role.model";
import { eq } from "drizzle-orm";
import { roles } from "@/lib/db/schema";

export class RoleRepository {
  static findRole(role: RoleModel.Enum) {
    return db.query.roles.findFirst({
      where: eq(roles.name, role),
    });
  }
}
