import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { MediaModel } from "./media.model";

export abstract class MediaRepository {
  static async create(user_id: number, payload: MediaModel.Create) {
    const [asset] = await db
      .insert(media)
      .values({
        ...payload,
        user_id: user_id,
      })
      .returning();

    return asset;
  }

  static async findOwnedById(id: number) {
    const [asset] = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    return asset;
  }
  static async findOwnedByKey(key: string, user_id: number) {
    const [asset] = await db
      .select()
      .from(media)
      .where(eq(media.storage_key, key))
      .limit(1);

    if (!asset || asset.user_id !== user_id) return null;

    return asset;
  }

  static async delete(id: number, user_id: number) {
    const asset = await this.findOwnedById(id, user_id);
    if (!asset) return null;

    await db.delete(media).where(eq(media.id, id));

    return asset;
  }
}
