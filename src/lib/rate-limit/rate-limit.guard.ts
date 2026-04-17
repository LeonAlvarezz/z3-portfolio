import Elysia from "elysia";
import { RateLimitService } from "@/lib/rate-limit";
import { RateLimitException } from "@/core/error";
import { RATE_LIMIT_CONFIG } from "./rate-limit.constant";
import { RateLimitModel } from "./rate-limit.model";
import { ip } from "@/core/request/ip";

export const rateLimitGuard = new Elysia({ name: "rate-limit-guard" })
  .use(ip)
  .macro({
    rateLimit: (config: RateLimitModel.RateLimitProps) => ({
      async resolve({ request, ip }) {
        const { windowMs, maxRequests } =
          config === true
            ? RATE_LIMIT_CONFIG
            : { ...RATE_LIMIT_CONFIG, ...config };

        const ipAddress = (ip?.address ?? "unknown").replace(/:/g, "-");

        const path = new URL(request.url).pathname;
        const key = `rate-limit:${ipAddress}:${path}`;
        const allowed = await RateLimitService.checkRateLimit({
          key,
          maxRequests,
          windowMs,
        });
        if (!allowed) {
          throw new RateLimitException();
        }
      },
    }),
  });
