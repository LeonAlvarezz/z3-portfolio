import Elysia from "elysia";
import {
  SimpleSuccess,
  SimpleSuccessSchema,
  Success,
  SuccessSchema,
} from "@/core/response";
import { authGuard } from "@/modules/auth/guard";
import { PortfolioModel } from "./portfolio.model";
import { PortfolioService } from "./portfolio.service";
import { OpenApiKey } from "../app/openapi";

export const portfolio = new Elysia({ name: "portfolio" })
  .use(authGuard)
  .group("/portfolios", (app) =>
    app
      .get(
        "/",
        async ({ user, query }) => {
          const data = await PortfolioService.paginateByUser(user.id, query);
          return Success(data);
        },
        {
          authenticated: true,
          detail: {
            summary: "Get portfolios for user",
            tags: [OpenApiKey.Portfolio],
          },
          query: PortfolioModel.PortfolioFilterSchema,
        },
      )
      .get(
        "/:id",
        async ({ user, params }) => {
          const data = await PortfolioService.findOwnedById(params.id, user.id);
          return Success(data);
        },
        {
          authenticated: true,
          params: PortfolioModel.PortfolioParamsSchema,
          detail: {
            summary: "Get portfolios by id",
            tags: [OpenApiKey.Portfolio],
          },
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
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
          body: PortfolioModel.CreatePortfolioSchema,
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
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
          params: PortfolioModel.PortfolioParamsSchema,
          body: PortfolioModel.UpdatePortfolioSchema,
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
        },
      )
      .delete(
        "/:id",
        async ({ user, params }) => {
          await PortfolioService.delete(params.id, user.id);
          return SimpleSuccess();
        },
        {
          authenticated: true,
          detail: {
            summary: "Delete Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          params: PortfolioModel.PortfolioParamsSchema,
          response: SimpleSuccessSchema(),
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
          params: PortfolioModel.PortfolioParamsSchema,
          detail: {
            summary: "Publish Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
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
          params: PortfolioModel.PortfolioParamsSchema,
          detail: {
            summary: "Unpublish Portfolio by ID",
            tags: [OpenApiKey.Portfolio],
          },
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
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
          params: PortfolioModel.PortfolioParamsSchema,
          body: PortfolioModel.AssignCategoriesSchema,
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
        },
      ),
  )
  .group("/public/portfolios", (app) =>
    app
      .get(
        "/",
        async ({ query }) => {
          const data = await PortfolioService.paginatePublished(query);
          return Success(data);
        },
        {
          query: PortfolioModel.PortfolioFilterSchema,
          detail: {
            summary: "Paginate portfolios",
            tags: [OpenApiKey.Portfolio],
          },
        },
      )
      .get(
        "/:slug",
        async ({ params }) => {
          const data = await PortfolioService.findPublishedBySlug(params.slug);
          return Success(data);
        },
        {
          params: PortfolioModel.PortfolioSlugParamsSchema,

          detail: {
            summary: "Get portfolio by slug",
            tags: [OpenApiKey.Portfolio],
          },
          response: SuccessSchema(PortfolioModel.PortfolioSchema),
        },
      )
      .post(
        "/:slug/view",
        async ({ params }) => {
          await PortfolioService.increaseView(params.slug);
          return SimpleSuccess();
        },
        {
          detail: {
            summary: "Increase portfolio view by slug",
            tags: [OpenApiKey.Portfolio],
          },
          params: PortfolioModel.PortfolioSlugParamsSchema,
          response: SimpleSuccessSchema(),
        },
      ),
  );
