import { Elysia } from "elysia";

import { createScopedLogger } from "@/lib/logger";
import { RateLimitService } from "@/lib/rate-limit";
import { ip } from "../request/ip";
import env from "@/lib/env";
import { DefaultErrorMessage, ErrorCode } from "./type";
import { getEnumKey } from "@/util/enum";
import { ErrorException, InvalidCredentialException } from ".";
import { isDrizzleError, parseDrizzleError } from "@/lib/db/error";
import { Fail } from "./response";

const logger = createScopedLogger("error-handler");

export const errorHandler = new Elysia({ name: "error-handling" })
  .use(ip)
  .onError(async ({ error, code, set, ip, request }) => {
    console.log({ error });

    logger.error("🔥 Error occurred", {
      error,
      code,
      method: request.method,
      path: new URL(request.url).pathname,
      ip: ip?.address ?? "unknown",
    });

    if (code === "VALIDATION") {
      return Fail({
        message: DefaultErrorMessage.VALIDATION,
        code: getEnumKey(DefaultErrorMessage, DefaultErrorMessage.VALIDATION),
        status: error.status,
        metadata: error.messageValue,
      });
    }

    if (error instanceof ErrorException) {
      if (error instanceof InvalidCredentialException) {
        if (env.NODE_ENV !== "test") {
          const ipAddress = (ip?.address ?? "unknown").replace(/:/g, "-");
          const path = new URL(request.url).pathname;
          const key = `rate-limit:${ipAddress}:${path}`;
          const allowed = await RateLimitService.checkRateLimit({ key });

          if (!allowed) {
            return Fail({
              message: DefaultErrorMessage.RATE_LIMIT,
              status: ErrorCode.RATE_LIMIT,
              code: getEnumKey(
                DefaultErrorMessage,
                DefaultErrorMessage.RATE_LIMIT,
              ),
            });
          }
        }
      }

      return Fail({
        message: error.message,
        status: error.status,
        code: error.code,
      });
    }

    if (isDrizzleError(error)) {
      const parsed = parseDrizzleError(error);
      return Fail({
        message: parsed.message,
        status: parsed.status,
        code: getEnumKey(ErrorCode, parsed.status),
      });
    }

    if (code === "NOT_FOUND") {
      return Fail({
        message: DefaultErrorMessage.ENDPOINT_NOT_FOUND,
        status: error.status,
        code: getEnumKey(DefaultErrorMessage, DefaultErrorMessage.NOT_FOUND),
      });
    }

    return {
      error: {
        status: set?.status ?? 500,
        message: error ?? DefaultErrorMessage.INTERNAL_SERVER,
        code: getEnumKey(
          DefaultErrorMessage,
          DefaultErrorMessage.INTERNAL_SERVER,
        ),
      },
      success: false,
    };
  })
  .as("global");
