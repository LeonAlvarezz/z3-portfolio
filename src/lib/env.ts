// env.ts
import { z } from "zod";

// Define the schema as an object with all of the env
// variables and their types
const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  NODE_ENV: z
    .union([
      z.literal("development"),
      z.literal("test"),
      z.literal("production"),
    ])
    .default("development"),
  DATABASE_URL: z.string().startsWith("postgres://"),
  HASH_PASSWORD_ALGORITHM: z.enum(["argon2id", "argon2d", "argon2i", "bcrypt"]),
  HASH_PASSWORD_COST: z.coerce.number(),
  REDIS_URL: z.string(),
});

// Validate `process.env` against our schema
// and return the result
export const env = envSchema.parse(process.env);
export default env;
