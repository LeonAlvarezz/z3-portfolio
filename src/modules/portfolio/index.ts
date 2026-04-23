import Elysia from "elysia";
import { SimpleSuccess, Success } from "@/core/error/response";
import { authGuard } from "@/modules/auth/guard";
import { PortfolioModel } from "./portfolio.model";
import { PortfolioService } from "./portfolio.service";
import { OpenApiKey } from "../app/openapi";
import { UserModel } from "../user/user.model";
import { BaseModel } from "@/core/model/base.model";

export const portfolio = new Elysia({ name: "portfolio" })
  .use(authGuard)
  .model({ ...PortfolioModel.OpenApiSchemas, ...BaseModel.OpenApiSchemas })
  .group("/portfolios", (app) =>
    app
      // .get(
      //   "/",
      //   async ({ user, query }) => {
      //     const data = await PortfolioService.paginateByUser(user.id, query);
      //     return Success(data);
      //   },
      //   {
      //     authenticated: true,
      //     detail: {
      //       summary: "Get portfolios for user",
      //       tags: [OpenApiKey.Portfolio],
      //     },
      //     query: PortfolioModel.OpenApi.Filter,
      //     response: PortfolioModel.OpenApi.ListPageResponse,
      //   },
      // )
      .get(
        "/:id",
        async ({ user, params }) => {
          const data = await PortfolioService.findOwnedById(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: PortfolioModel.ParamsSchema,
          detail: {
            summary: "Get portfolios by id",
            tags: [OpenApiKey.Portfolio],
          },
          response: PortfolioModel.OpenApi.ListItemResponse,
        },
      )
      .post(
        "/",
        async ({ user, body }) => {
          const data = await PortfolioService.create(user.id, body);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          detail: {
            summary: "Create new portfolio",
            tags: [OpenApiKey.Portfolio],
          },
          body: PortfolioModel.OpenApi.Create,
          response: PortfolioModel.OpenApi.ListItemResponse,
        },
      )
      .put(
        "/:id",
        async ({ user, params, body }) => {
          const data = await PortfolioService.update(params.id, user.id, body);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          detail: {
            summary: "Update Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          params: PortfolioModel.ParamsSchema,
          body: PortfolioModel.OpenApi.Update,
          response: PortfolioModel.OpenApi.ListItemResponse,
        },
      )
      .delete(
        "/:id",
        ({ user, params }) => {
          void PortfolioService.delete(params.id, user.id);
          return SimpleSuccess();
        },
        {
          authenticated: true,
          detail: {
            summary: "Delete Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          params: PortfolioModel.ParamsSchema,
          response: BaseModel.OpenApi.SimpleSuccessResponse,
        },
      )
      .post(
        "/:id/publish",
        async ({ user, params }) => {
          const data = await PortfolioService.publish(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: PortfolioModel.ParamsSchema,
          detail: {
            summary: "Publish Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          response: PortfolioModel.OpenApi.ListItemResponse,
        },
      )
      .post(
        "/:id/unpublish",
        async ({ user, params }) => {
          const data = await PortfolioService.unpublish(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: PortfolioModel.ParamsSchema,
          detail: {
            summary: "Unpublish Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          response: PortfolioModel.OpenApi.ListItemResponse,
        },
      )
      .put(
        "/:id/categories",
        async ({ user, params, body }) => {
          const data = await PortfolioService.assignCategories(
            params.id,
            user.id,
            body,
          );
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          detail: {
            summary: "Assign category to portfolio",
            tags: [OpenApiKey.Portfolio],
          },
          params: PortfolioModel.ParamsSchema,
          body: PortfolioModel.OpenApi.AssignCategories,
          response: PortfolioModel.OpenApi.ListItemResponse,
        },
      ),
  )
  .group("/public/portfolios", (app) =>
    app
      // .get(
      //   "/",
      //   async ({ query }) => {
      //     const data = await PortfolioService.paginatePublished(query);
      //     return Success(data);
      //   },
      //   {
      //     query: PortfolioModel.OpenApi.Filter,
      //     detail: {
      //       summary: "Paginate portfolios",
      //       tags: [OpenApiKey.Portfolio],
      //     },
      //     response: PortfolioModel.OpenApi.ListPageResponse,
      //   },
      // )
      .get(
        "/by-username/:username/published",
        async ({ params, query }) => {
          const data = await PortfolioService.paginatePublishedByUser(
            {
              ...query,
              published: true,
            },
            params.username,
          );
          return Success(data);
        },
        {
          params: UserModel.UserSchema.pick({
            username: true,
          }),
          query: PortfolioModel.OpenApi.Filter,
          detail: {
            summary: "Get published portfolios by username",
            description:
              "Returns published portfolios for a public user profile identified by username.",
            tags: [OpenApiKey.Portfolio],
          },
          response: PortfolioModel.OpenApi.ListPageResponse,
        },
      )

      .get(
        "/by-username/:username/published/slugs",
        async ({ params }) => {
          const data = await PortfolioService.findAllPublishedSlugs(
            params.username,
          );
          return Success(data);
        },
        {
          params: UserModel.UserSchema.pick({
            username: true,
          }),
          detail: {
            summary: "Get all public portfolio slugs",
            tags: [OpenApiKey.Portfolio],
          },
          response: BaseModel.OpenApi.StringList,
        },
      )
      .get(
        "/:slug",
        async ({ params }) => {
          const data = await PortfolioService.findPublishedBySlug(params.slug);
          return Success(data);
        },
        {
          params: PortfolioModel.SlugParamsSchema,

          detail: {
            summary: "Get portfolio by slug",
            tags: [OpenApiKey.Portfolio],
          },
          response: PortfolioModel.OpenApi.DetailResponse,
        },
      )
      .post(
        "/:slug/view",
        ({ params }) => {
          void PortfolioService.increaseView(params.slug);
          return SimpleSuccess();
        },
        {
          detail: {
            summary: "Increase portfolio view by slug",
            tags: [OpenApiKey.Portfolio],
          },
          params: PortfolioModel.SlugParamsSchema,
          response: BaseModel.OpenApi.SimpleSuccessResponse,
        },
      ),
  );
