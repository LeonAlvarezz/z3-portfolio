import { auth } from "@/modules/auth";
import { transaction } from "@/modules/transaction";
import { user } from "@/modules/user";
import Elysia from "elysia";

export const routeHandler = new Elysia({ name: "route-handler" })
  .use(auth)
  .use(user)
  .use(transaction);
