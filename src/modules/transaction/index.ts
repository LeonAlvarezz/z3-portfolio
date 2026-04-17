import Elysia from "elysia";
import { authGuard } from "../auth/guard";

export const transaction = new Elysia()
  .use(authGuard)
  .group("/transactions", (app) =>
    app.get(
      "/",
      () => {
        return {
          type: "transaction",
        };
      },
      {
        protected: true,
      },
    ),
  );
