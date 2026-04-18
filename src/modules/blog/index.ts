import Elysia from "elysia";
import {
	SimpleSuccess,
	SimpleSuccessSchema,
	Success,
	SuccessSchema,
} from "@/core/response";
import { authGuard } from "@/modules/auth/guard";
import { OpenApiKey } from "../app/openapi";
import { BlogModel } from "./blog.model";
import { BlogService } from "./blog.service";

export const blog = new Elysia({ name: "blog" })
	.use(authGuard)
	.group("/blogs", (app) =>
		app
			.get(
				"/",
				async ({ user, query }) => {
					const data = await BlogService.paginateByUser(user.id, query);
					return Success(data);
				},
				{
					authenticated: true,
					query: BlogModel.BlogFilterSchema,
					detail: {
						summary: "Get blogs for authenticated user",
						tags: [OpenApiKey.Blog],
					},
				},
			)
			.get(
				"/:id",
				async ({ user, params }) => {
					const data = await BlogService.findOwnedById(params.id, user.id);
					return Success(data);
				},
				{
					authenticated: true,
					params: BlogModel.BlogParamsSchema,
					detail: {
						summary: "Get blog by ID",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
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
					body: BlogModel.CreateBlogSchema,
					detail: {
						summary: "Create blog",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
				},
			)
			.patch(
				"/:id",
				async ({ user, params, body }) => {
					const data = await BlogService.update(params.id, user.id, body);
					return Success(data);
				},
				{
					authenticated: true,
					parse: "application/json",
					params: BlogModel.BlogParamsSchema,
					body: BlogModel.UpdateBlogSchema,
					detail: {
						summary: "Update blog by ID",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
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
					params: BlogModel.BlogParamsSchema,
					detail: {
						summary: "Delete blog by ID",
						tags: [OpenApiKey.Blog],
					},
					response: SimpleSuccessSchema(),
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
					params: BlogModel.BlogParamsSchema,
					detail: {
						summary: "Publish blog by ID",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
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
					params: BlogModel.BlogParamsSchema,
					detail: {
						summary: "Unpublish blog by ID",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
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
					params: BlogModel.BlogParamsSchema,
					body: BlogModel.AssignCategoriesSchema,
					detail: {
						summary: "Assign categories to blog",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
				},
			),
	)
	.group("/public/blogs", (app) =>
		app
			.get(
				"/",
				async ({ query }) => {
					const data = await BlogService.paginatePublished(query);
					return Success(data);
				},
				{
					query: BlogModel.BlogFilterSchema,
					detail: {
						summary: "Paginate public blogs",
						tags: [OpenApiKey.Blog],
					},
				},
			)
			.get(
				"/:slug",
				async ({ params }) => {
					const data = await BlogService.findPublishedBySlug(params.slug);
					return Success(data);
				},
				{
					params: BlogModel.BlogSlugParamsSchema,
					detail: {
						summary: "Get public blog by slug",
						tags: [OpenApiKey.Blog],
					},
					response: SuccessSchema(BlogModel.BlogSchema),
				},
			)
			.post(
				"/:slug/view",
				async ({ params }) => {
					await BlogService.increaseView(params.slug);
					return SimpleSuccess();
				},
				{
					params: BlogModel.BlogSlugParamsSchema,
					detail: {
						summary: "Increase blog view by slug",
						tags: [OpenApiKey.Blog],
					},
					response: SimpleSuccessSchema(),
				},
			),
	);
