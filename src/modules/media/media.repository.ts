import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import type { MediaModel } from "./media.model";

export abstract class MediaRepository {
  static async create(
    userId: number,
    payload: MediaModel.PresignedUploadRequest & { storage_key: string },
  ) {
    const [asset] = await db
      .insert(media)
      .values({
        storage_key: payload.storage_key,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        size: payload.size,
        user_id: userId,
      })
      .returning();

    return asset;
  }

  static async findOwnedById(id: number, userId: number) {
    const [asset] = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!asset || asset.user_id !== userId) return null;

    return asset;
  }

  static async delete(id: number, userId: number) {
    const asset = await this.findOwnedById(id, userId);
    if (!asset) return null;

    await db.delete(media).where(eq(media.id, id));

    return asset;
  }
}
