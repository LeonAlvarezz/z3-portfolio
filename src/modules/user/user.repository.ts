import { eq } from "drizzle-orm";
import { type DrizzleTransaction, db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UserModel } from "./user.model";

export abstract class UserRepository {
  static async create(
    payload: UserModel.UpsertUserDto,
    tx?: DrizzleTransaction,
  ) {
    const client = tx ? tx : db;
    const [result] = await client.insert(users).values(payload).returning();
    return result;
  }

  static async findByEmail(email: string) {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }
  static async findAll() {
    return await db.query.users.findMany();
  }
}
