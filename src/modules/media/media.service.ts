import { NotFoundException } from "@/core/error";
import { R2Service } from "@/lib/r2";
import { MediaRepository } from "./media.repository";

export abstract class MediaService {
  static async upload(userId: number, file: File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop();
    const storage_key = `users/${userId}/${Date.now()}.${ext}`;

    await R2Service.upload(storage_key, buffer, file.type);

    return MediaRepository.create(userId, {
      storage_key,
      file_name: file.name,
      mime_type: file.type,
      size: file.size,
    });
  }

  static async getPresignedDownloadUrl(id: number) {
    const asset = await MediaRepository.findOwnedById(id);
    if (!asset) throw new NotFoundException({ message: "Media not found" });

    const download_url = await R2Service.getPresignedDownloadUrl(
      asset.storage_key,
    );

    return { download_url };
  }

  static async getPresignedUrl(key: string, userId: number) {
    const asset = await MediaRepository.findOwnedByKey(key, userId);
    if (!asset) throw new NotFoundException({ message: "Media not found" });

    const download_url = await R2Service.getPresignedDownloadUrl(
      asset.storage_key,
    );

    return { download_url };
  }

  static async delete(id: number, userId: number) {
    const asset = await MediaRepository.delete(id, userId);
    if (!asset) throw new NotFoundException({ message: "Media not found" });

    await R2Service.delete(asset.storage_key);
  }
}
