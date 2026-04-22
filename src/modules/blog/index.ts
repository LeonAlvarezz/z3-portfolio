import Elysia from "elysia";
import { SimpleSuccess, Success } from "@/core/error/response";
import { authGuard } from "@/modules/auth/guard";
import { OpenApiKey } from "../app/openapi";
import { BlogModel } from "./blog.model";
import { BlogService } from "./blog.service";
import { UserModel } from "../user/user.model";
import { BaseModel } from "@/core/model/base.model";

export const blog = new Elysia({ name: "blog" })
  .use(authGuard)
  .model({ ...BlogModel.OpenApiSchemas, ...BaseModel.OpenApiSchemas })
  .group("/blogs", (app) =>
    app
      // .get(
      //   "/",
      //   async ({ user, query }) => {
      //     const data = await BlogService.paginateByUser(user.id, query);
      //     return Success(data);
      //   },
      //   {
      //     authenticated: true,
      //     query: BlogModel.BlogFilterSchema,
      //     detail: {
      //       summary: "Get blogs for authenticated user",
      //       tags: [OpenApiKey.Blog],
      //     },
      //   },
      // )
      .get(
        "/:id",
        async ({ user, params }) => {
          const data = await BlogService.findOwnedById(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: BlogModel.OpenApi.Params,
          detail: {
            summary: "Get blog by ID",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.Response,
        },
      )
      .post(
        "/",
        async ({ user, body }) => {
          const data = await BlogService.create(user.id, body);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          body: BlogModel.OpenApi.Create,
          detail: {
            summary: "Create blog",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.Response,
        },
      )
      .put(
        "/:id",
        async ({ user, params, body }) => {
          const data = await BlogService.update(params.id, user.id, body);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          params: BlogModel.OpenApi.Params,
          body: BlogModel.OpenApi.Update,
          detail: {
            summary: "Update blog by ID",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.Response,
        },
      )
      .delete(
        "/:id",
        async ({ user, params }) => {
          await BlogService.delete(params.id, user.id);
          return SimpleSuccess();
        },
        {
          authenticated: true,
          params: BlogModel.OpenApi.Params,
          detail: {
            summary: "Delete blog by ID",
            tags: [OpenApiKey.Blog],
          },
          response: BaseModel.OpenApi.SimpleSuccessResponse,
        },
      )
      .post(
        "/:id/publish",
        async ({ user, params }) => {
          const data = await BlogService.publish(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: BlogModel.OpenApi.Params,
          detail: {
            summary: "Publish blog by ID",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.Response,
        },
      )
      .post(
        "/:id/unpublish",
        async ({ user, params }) => {
          const data = await BlogService.unpublish(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: BlogModel.OpenApi.Params,
          detail: {
            summary: "Unpublish blog by ID",
            tags: [OpenApiKey.Blog],
          },

          response: BlogModel.OpenApi.Response,
        },
      )
      .put(
        "/:id/categories",
        async ({ user, params, body }) => {
          const data = await BlogService.assignCategories(
            params.id,
            user.id,
            body,
          );
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          params: BlogModel.ParamsSchema,
          body: BlogModel.OpenApi.AssignCategories,
          detail: {
            summary: "Assign categories to blog",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.Response,
        },
      ),
  )
  .group("/public/blogs", (app) =>
    app
      // .get(
      //     "/",
      //     async ({ query }) => {
      //       const data = await BlogService.paginatePublished(query);
      //       return Success(data);
      //     },
      //     {
      //       query: BlogModel.FilterSchema,
      //       detail: {
      //         summary: "Paginate public blogs",
      //         tags: [OpenApiKey.Blog],
      //       },
      //     },
      // )
      .get(
        "/by-username/:username/published",
        async ({ query, params }) => {
          const data = await BlogService.paginatePublishedByUsername(
            query,
            params.username,
          );
          return Success(data);
        },
        {
          query: BlogModel.FilterSchema,
          params: UserModel.UserSchema.pick({
            username: true,
          }),
          detail: {
            summary: "Paginate public blogs",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.ListResponse,
        },
      )

      .get(
        "/by-username/:username/published/slugs",
        async ({ params }) => {
          const data = await BlogService.findAllPublishedSlugs(params.username);
          return Success(data);
        },
        {
          params: UserModel.UserSchema.pick({
            username: true,
          }),
          detail: {
            summary: "Get all public blog slugs",
            tags: [OpenApiKey.Blog],
          },
          response: BaseModel.OpenApi.StringList,
        },
      )

      .get(
        "/:slug",
        async ({ params }) => {
          const data = await BlogService.findPublishedBySlug(params.slug);
          return Success(data);
        },
        {
          params: BlogModel.OpenApi.SlugParams,
          detail: {
            summary: "Get public blog by slug",
            tags: [OpenApiKey.Blog],
          },
          response: BlogModel.OpenApi.Response,
        },
      )
      .post(
        "/:slug/view",
        async ({ params }) => {
          await BlogService.increaseView(params.slug);
          return SimpleSuccess();
        },
        {
          params: BlogModel.OpenApi.SlugParams,
          detail: {
            summary: "Increase blog view by slug",
            tags: [OpenApiKey.Blog],
          },
          response: BaseModel.OpenApi.SimpleSuccessResponse,
        },
      ),
  );
