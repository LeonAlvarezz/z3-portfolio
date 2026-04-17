export namespace RateLimitModel {
  export type RateLimitConfig = {
    windowMs?: number; // Time window in milliseconds
    maxRequests?: number; // Max requests per window
  };

  export type RateLimitProps = true | RateLimitConfig;

  export type RateLimitWithKeyProps = RateLimitConfig & {
    key: string;
  };
}
