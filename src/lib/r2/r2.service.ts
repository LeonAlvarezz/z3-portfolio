import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../env";
import { r2 } from "./r2.client";

const PRESIGNED_URL_EXPIRES_IN = 3600; // 1 hour

export const R2Service = {
  async upload(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    return r2.send(command);
  },

  async getPresignedDownloadUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });
    return getSignedUrl(r2, command, { expiresIn: PRESIGNED_URL_EXPIRES_IN });
  },

  async delete(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    });
    return r2.send(command);
  },
};
