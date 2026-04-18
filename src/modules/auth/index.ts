import Elysia from "elysia";
import { AuthModel } from "./auth.model";
import { BaseModel } from "@/core/model/base.model";
import { UserModel } from "../user/user.model";
import { BadRequestException } from "@/core/error";
import {
  SimpleSuccessSchema,
  SimpleSuccess,
  Success,
  SuccessSchema,
} from "@/core/response";
import { authGuard } from "./guard";
import { AuthService } from "./auth.service";
import { OpenApiKey } from "../app/openapi";
import { RedisService } from "@/lib/redis/redis.service";
import { rateLimitGuard } from "../../lib/rate-limit/rate-limit.guard";
import env from "@/lib/env";

export const auth = new Elysia()
  .use(authGuard)
  .use(rateLimitGuard)
  .group("/auths", (app) => {
    app.get(
      "/me",
      async ({ user }) => {
        return Success(user);
      },
      {
        authenticated: true,
        cookie: BaseModel.CookieSchema,
        detail: {
          summary: "Get user info",
          description:
            "Returns the currently authenticated user's public profile using the active session cookie.",
          tags: [OpenApiKey.Auth],
        },
        response: SuccessSchema(UserModel.UserPublicSchema),
      },
    );
    app.post(
      "/sign-up",
      async ({ body }) => {
        await AuthService.signUp(body);
        return SimpleSuccess();
      },
      {
        parse: "application/json",
        body: AuthModel.SignUpSchema,
        rateLimit: true,
        detail: {
          summary: "Sign up",
          description:
            "Creates a new user account with the provided registration details.",
          tags: [OpenApiKey.Auth],
        },
        response: SimpleSuccessSchema(),
      },
    );
    app.post(
      "/sign-in",
      async ({ cookie: { session_token }, body }) => {
        const data = await AuthService.signIn(body);
        session_token.set({
          value: data.session_token,
          httpOnly: true,
          sameSite: "lax",
          secure: env.NODE_ENV === "production",
          path: "/",
          maxAge: Math.max(
            0,
            Math.floor(
              (new Date(data.expires_at).getTime() - Date.now()) / 1000,
            ),
          ),
        });
        await RedisService.setSession(data.session_token, data.user);
        return Success(data);
      },
      {
        parse: "application/json",
        body: AuthModel.SignInSchema,
        cookie: BaseModel.CookieSchema,
        rateLimit: true,
        detail: {
          summary: "Sign in",
          description:
            "Authenticates a user, creates a session, stores the session cookie, and returns the signed-in user data.",
          tags: [OpenApiKey.Auth],
        },

        response: SuccessSchema(UserModel.UserPublicSessionSchema),
      },
    );

    app.post(
      "/sign-out",
      async ({ cookie: { session_token } }) => {
        const token = session_token.value;
        if (!token) throw new BadRequestException({ message: "Missing Token" });
        await AuthService.signOut(token);
        await RedisService.deleteSession(token);
        session_token.remove();
        return SimpleSuccess();
      },
      {
        cookie: BaseModel.CookieSchema,
        detail: {
          summary: "Sign out",
          description:
            "Invalidates the current session, removes the stored session from cache, and clears the session cookie.",
          tags: ["Auth"],
        },
        response: SimpleSuccessSchema(),
      },
    );

    return app;
  });
