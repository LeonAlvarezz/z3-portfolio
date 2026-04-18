import { db, DrizzleTransaction } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ResourceModel } from "./resource.model";
import { resources } from "@/lib/db/schema";

export class ResourceRepository {
  static async findAll() {
    return await db.query.resources.findMany();
  }
  static async create(payload: ResourceModel.Create) {
    return await db.insert(resources).values({
      name: payload.name,
    });
  }

  static async findByName(name: string, tx?: DrizzleTransaction) {
    const client = tx ? tx : db;
    return await client.query.resources.findFirst({
      where: eq(resources.name, name),
    });
  }
}
