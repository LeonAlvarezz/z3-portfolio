import { BaseModel } from "@/core/model/base.model";
import { Success } from "@/core/response";
import Elysia from "elysia";
import { SuccessSchema } from "@/core/response";
import { OpenApiKey } from "./openapi";

export const appInfo = new Elysia().get(
  "/health-check",
  () => {
    const uptime = process.uptime();
    return Success({
      uptime,
      message: "OK",
    });
  },
  {
    detail: {
      summary: "Health Check",
      tags: [OpenApiKey.App],
    },
    response: {
      200: SuccessSchema(BaseModel.HealthCheckSchema),
    },
  },
);
