import { db, DrizzleTransaction } from "@/lib/db";
import { RoleModel } from "./role.model";
import { eq } from "drizzle-orm";
import { roles } from "@/lib/db/schema";

export class RoleRepository {
  static findRole(role: RoleModel.Enum) {
    return db.query.roles.findFirst({
      where: eq(roles.name, role),
    });
  }

  static findById(id: number, tx?: DrizzleTransaction) {
    const client = tx ? tx : db;
    return client.query.roles.findFirst({
      where: eq(roles.id, id),
      with: {
        permission_flags: {
          with: {
            resource: true,
          },
        },
      },
    });
  }

  static async create(payload: RoleModel.Create, tx?: DrizzleTransaction) {
    const client = tx ? tx : db;
    const [result] = await client
      .insert(roles)
      .values({
        name: payload.name,
      })
      .returning();
    return result;
  }

  static delete(id: number, tx?: DrizzleTransaction) {
    const client = tx ? tx : db;
    return client.delete(roles).where(eq(roles.id, id));
  }
}
