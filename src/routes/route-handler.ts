import { auth } from "@/modules/auth";
import { blog } from "@/modules/blog";
import { category } from "@/modules/category";
import { portfolio } from "@/modules/portfolio";
import { user } from "@/modules/user";
import Elysia from "elysia";

export const routeHandler = new Elysia({ name: "route-handler" })
  .use(auth)
  .use(user)
  .use(category)
  .use(blog)
  .use(portfolio);
