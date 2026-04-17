import { BaseModel } from "@/core/model/base.model";
import z from "zod";

export namespace SessionModel {
  /** DB row shape (runtime validation) */
  export const SessionSchema = BaseModel.BaseRowNullableSchema.extend({
    user_id: z.number(),
    session_token_hash: z.string(),

    ip: z.string().nullable().optional(),
    user_agent: z.string().nullable().optional(),

    expires_at: z.iso.datetime(),
  });

  /** Create session payload (what service/repo needs) */
  export const CreateSessionSchema = z.object({
    user_id: z.number(),
    session_token_hash: z.string(),
    expires_at: z.iso.datetime(),
    ip: z.string().nullable().optional(),
    user_agent: z.string().nullable().optional(),
  });

  /** Touch session (update last_seen_at) */
  export const TouchSessionSchema = z.object({
    session_id: z.number().optional(),
    session_token_hash: z.string().optional(),
    last_seen_at: z.iso.date().optional(),
  });

  export type SessionDto = z.infer<typeof SessionSchema>;
  export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
}
