import Elysia from "elysia";
import {
  SimpleSuccess,
  SimpleSuccessSchema,
  Success,
  SuccessSchema,
} from "@/core/response";
import { authGuard } from "@/modules/auth/guard";
import { OpenApiKey } from "../app/openapi";
import { CategoryModel } from "./category.model";
import { CategoryService } from "./category.service";

export const category = new Elysia({ name: "category" })
  .use(authGuard)
  .group("/categories", (app) =>
    app
      .get(
        "/",
        async ({ user }) => {
          const data = await CategoryService.findByUser(user.id);
          return Success(data);
        },
        {
          authenticated: true,
          detail: {
            summary: "Get categories for authenticated user",
            description:
              "Returns all categories that belong to the currently authenticated user.",
            tags: [OpenApiKey.Category],
          },
          response: SuccessSchema(CategoryModel.CategorySchema.array()),
        },
      )
      .post(
        "/",
        async ({ user, body }) => {
          const data = await CategoryService.create(user.id, body);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          body: CategoryModel.CreateCategorySchema,
          detail: {
            summary: "Create category",
            description:
              "Creates a new category for the currently authenticated user.",
            tags: [OpenApiKey.Category],
          },
          response: SuccessSchema(CategoryModel.CategorySchema),
        },
      )
      .patch(
        "/:id",
        async ({ user, params, body }) => {
          const data = await CategoryService.update(params.id, user.id, body);
          return Success(data);
        },
        {
          authenticated: true,
          parse: "application/json",
          params: CategoryModel.CategoryParamsSchema,
          body: CategoryModel.UpdateCategorySchema,
          detail: {
            summary: "Update category by ID",
            description:
              "Updates an existing category owned by the currently authenticated user.",
            tags: [OpenApiKey.Category],
          },
          response: SuccessSchema(CategoryModel.CategorySchema),
        },
      )
      .delete(
        "/:id",
        async ({ user, params }) => {
          await CategoryService.delete(params.id, user.id);
          return SimpleSuccess();
        },
        {
          authenticated: true,
          params: CategoryModel.CategoryParamsSchema,
          detail: {
            summary: "Delete category by ID",
            description:
              "Deletes a category owned by the currently authenticated user.",
            tags: [OpenApiKey.Category],
          },
          response: SimpleSuccessSchema(),
        },
      ),
  )
  .group("/public/categories", (app) =>
    app.get(
      "/",
      async () => {
        const data = await CategoryService.findAllPublic();
        return Success(data);
      },
      {
        detail: {
          summary: "Get public categories",
          description: "Returns all categories that are publicly available.",
          tags: [OpenApiKey.Category],
        },
        response: SuccessSchema(CategoryModel.CategorySchema.array()),
      },
    ),
  );
