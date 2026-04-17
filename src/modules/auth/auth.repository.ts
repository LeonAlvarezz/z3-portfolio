import { db, DrizzleTransaction } from "@/lib/db";
import { auths } from "@/lib/db/schema";
import { AuthModel } from "./auth.model";
import { eq } from "drizzle-orm";

export abstract class AuthRepository {
  static async create(
    payload: AuthModel.UpsertAuthDto,
    tx?: DrizzleTransaction,
  ) {
    const client = tx ? tx : db;
    const [result] = await client.insert(auths).values(payload).returning();
    return result;
  }

  static async findByUserId(user_id: number) {
    return await db.query.auths.findFirst({
      where: eq(auths.user_id, user_id),
    });
  }
}
