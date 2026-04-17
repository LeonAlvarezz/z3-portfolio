import { redis } from "../redis";
import { RATE_LIMIT_CONFIG } from "./rate-limit.constant";
import { RateLimitModel } from "./rate-limit.model";

export class RateLimitService {
  static async checkRateLimit({
    key,
    windowMs,
    maxRequests,
  }: RateLimitModel.RateLimitWithKeyProps): Promise<boolean> {
    const current = await redis.incr(key);
    const requests = maxRequests ?? RATE_LIMIT_CONFIG.maxRequests;
    const windows = windowMs ?? RATE_LIMIT_CONFIG.windowMs;
    // First request, set expiration
    if (current === 1) {
      await redis.expire(key, Math.ceil(windows / 1000));
    }
    return current <= requests;
  }

  static async getRemainingRequests({
    key,
    maxRequests,
  }: RateLimitModel.RateLimitWithKeyProps): Promise<number> {
    const current = await redis.get(key);
    const requests = current ? parseInt(current) : 0;
    const mRequests = maxRequests ?? RATE_LIMIT_CONFIG.maxRequests;
    return Math.max(0, mRequests - requests);
  }
}
