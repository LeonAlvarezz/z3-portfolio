import { UserModel } from "@/modules/user/user.model";
import { redis } from "./index";
import { REDIS_SESSION_EXPERATION, REDIS_SESSION_KEY } from "./redis.constant";
export abstract class RedisService {
	static async setSession(
		session_token: string,
		user: UserModel.UserPublicDto,
		ex?: number,
	) {
		const key = `${REDIS_SESSION_KEY}:${session_token}`;
		await redis.setex(
			key,
			ex ?? REDIS_SESSION_EXPERATION,
			JSON.stringify(user),
		);
	}
	static async getSession(session_token: string) {
		const key = `${REDIS_SESSION_KEY}:${session_token}`;
		const userStr = await redis.getex(key);
		if (!userStr) {
			return null;
		}
		return UserModel.UserPublicSchema.parse(JSON.parse(userStr));
	}

	static async deleteSession(session_token: string) {
		const key = `${REDIS_SESSION_KEY}:${session_token}`;
		await redis.del(key);
	}
}
