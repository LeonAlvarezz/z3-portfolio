import { db, DrizzleTransaction } from "@/lib/db";
import { PermissionFlagModel } from "./permission-flag.model";
import { permissionFlags } from "@/lib/db/schema";

export class PermissionFlagRepository {
  static async create(
    role_id: number,
    payload: PermissionFlagModel.Create,
    tx?: DrizzleTransaction,
  ) {
    const client = tx ? tx : db;
    return await client.insert(permissionFlags).values({
      role_id: role_id,
      resource_id: payload.resource_id,
      read: payload.read,
      write: payload.write,
      delete: payload.delete,
    });
  }

  static async upsert(
    role_id: number,
    payload: PermissionFlagModel.Create,
    tx: DrizzleTransaction,
  ) {
    const client = tx ? tx : db;

    return await client
      .insert(permissionFlags)
      .values({
        role_id,
        resource_id: payload.resource_id,
        read: payload.read,
        write: payload.write,
        delete: payload.delete,
      })
      .onConflictDoUpdate({
        target: [permissionFlags.role_id, permissionFlags.resource_id],
        set: {
          read: payload.read,
          write: payload.write,
          delete: payload.delete,
        },
      });
  }

  public findAll() {
    return db.query.permissionFlags.findMany();
  }
}
