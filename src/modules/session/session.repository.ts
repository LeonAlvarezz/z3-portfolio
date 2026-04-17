import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import type { SessionModel } from "./session.model";
import {
  SESSION_EXPIRES_DATE_MS,
  SESSION_EXTENDS_EXPIRES_DATE_MS,
} from "@/constant/app";

export abstract class SessionRepository {
  static async create(payload: SessionModel.CreateSessionDto) {
    const [result] = await db.insert(sessions).values(payload).returning();
    return result;
  }
  static async findByToken(sessionToken: string) {
    return await db.query.sessions.findFirst({
      where: eq(sessions.session_token_hash, sessionToken),
      with: {
        user: true,
      },
    });
  }

  static async deleteSessionById(sessionId: number) {
    return await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  static async updateSessionExpiredAt(sessionId: number, expiredAt: string) {
    return await db
      .update(sessions)
      .set({
        expires_at: expiredAt,
      })
      .where(eq(sessions.id, sessionId));
  }

  static async updateTime(id: number, time: number): Promise<string | null> {
    // If expired, delete session and return null
    if (Date.now() >= time) {
      await SessionRepository.deleteSessionById(id);
      return null;
    }

    //If token expires tomorrow, then extends 15 days
    if (Date.now() >= time - SESSION_EXTENDS_EXPIRES_DATE_MS) {
      const extendedTime = new Date(
        Date.now() + SESSION_EXPIRES_DATE_MS,
      ).toISOString();
      await this.updateSessionExpiredAt(id, extendedTime);
      return extendedTime;
    }

    return new Date(time).toISOString();
  }
}
