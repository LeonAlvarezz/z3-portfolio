import Elysia, { t } from "elysia";
import {
  SimpleSuccess,
  SimpleSuccessSchema,
  Success,
} from "@/core/error/response";
import { authGuard } from "@/modules/auth/guard";
import { OpenApiKey } from "../app/openapi";
import { MediaModel } from "./media.model";
import { MediaService } from "./media.service";

export const mediaModule = new Elysia({ name: "media" })
  .use(authGuard)
  .model(MediaModel.OpenApiSchemas)
  .group("/media", (app) =>
    app
      .post(
        "/upload",
        async ({ user, body }) => {
          const data = await MediaService.upload(user.id, body.file);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "multipart/form-data",
          body: t.Object({ file: t.File() }),
          detail: {
            summary: "Upload media",
            description:
              "Uploads a file to R2 storage and saves the media record. Use the returned storage_key or id to get a presigned download URL.",
            tags: [OpenApiKey.Media],
          },
          response: MediaModel.OpenApi.Entity,
        },
      )
      .get(
        "/:id/presigned-download",
        async ({ params }) => {
          const data = await MediaService.getPresignedDownloadUrl(params.id);
          return Success(data);
        },
        {
          params: MediaModel.ParamsSchema,
          detail: {
            summary: "Get presigned download URL by ID",
            description:
              "Returns a presigned URL to display or download a media asset.",
            tags: [OpenApiKey.Media],
          },
          response: MediaModel.OpenApi.PresignedDownloadResponse,
        },
      )

      // .get(
      //   "/presigned-url",
      //   async ({ user, query }) => {
      //     const data = await MediaService.getPresignedUrl(
      //       query.storage_key,
      //       user.id,
      //     );
      //     return Success(data);
      //   },
      //   {
      //     authenticated: true,
      //     query: MediaModel.StorageKeySchema,
      //     detail: {
      //       summary: "Get presigned download URL by key",
      //       description:
      //         "Returns a presigned URL to display or download a media asset.",
      //       tags: [OpenApiKey.Media],
      //     },
      //     response: MediaModel.OpenApi.PresignedDownloadResponse,
      //   },
      // )
      .delete(
        "/:id",
        async ({ user, params }) => {
          await MediaService.delete(params.id, user.id);
          return SimpleSuccess();
        },
        {
          authenticated: true,
          params: MediaModel.ParamsSchema,
          detail: {
            summary: "Delete media",
            description: "Deletes a media record and its file from R2 storage.",
            tags: [OpenApiKey.Media],
          },
          response: SimpleSuccessSchema(),
        },
      ),
  );
