import { ForbiddenException, UnauthorizedException } from "@/core/error";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/util/password";
import { generateSessionToken, hashSessionToken } from "@/util/session-token";
import type { AuthModel } from "./auth.model";
import { AuthRepository } from "./auth.repository";
import { SessionRepository } from "@/modules/session/session.repository";
import { SimpleSuccess } from "@/core/response";
import { UserRepository } from "@/modules/user/user.repository";
import { UserModel } from "@/modules/user/user.model";
import { roles } from "@/lib/db/schema";
import { SESSION_EXPIRES_DATE_MS } from "@/constant/app";

export class AuthService {
	static async signUp(payload: AuthModel.SignUpDto) {
		const isUserExist = await UserRepository.findByEmail(payload.email);
		if (isUserExist)
			throw new ForbiddenException({
				message: "User with the same email already exist",
			});
		return await db.transaction(async (tx) => {
			const [defaultRole] = await tx
				.insert(roles)
				.values({ name: UserModel.RoleEnum.User })
				.onConflictDoUpdate({
					target: roles.name,
					set: { name: UserModel.RoleEnum.User },
				})
				.returning();
			const user = await UserRepository.create(
				{
					email: payload.email,
					username: payload.username,
					public_id: crypto.randomUUID(),
					role_id: defaultRole.id,
				},
				tx,
			);
			const password_hash = await hashPassword(payload.password);
			await AuthRepository.create(
				{
					password_hash,
					user_id: user.id,
				},
				tx,
			);
			return SimpleSuccess();
		});
	}

	static async signIn(
		payload: AuthModel.SignInDto,
	): Promise<UserModel.UserPublicSessionDto> {
		const user = await UserRepository.findByEmail(payload.email);
		if (!user) throw new UnauthorizedException();
		const auth = await AuthRepository.findByUserId(user.id);
		if (!auth) throw new UnauthorizedException();
		const isValidPassword = await verifyPassword(
			payload.password,
			auth.password_hash,
		);
		if (!isValidPassword) throw new UnauthorizedException();

		const sessionToken = generateSessionToken();
		const sessionTokenHash = hashSessionToken(sessionToken);

		const expiresAt = new Date(
			Date.now() + SESSION_EXPIRES_DATE_MS,
		).toISOString();

		await SessionRepository.create({
			user_id: user.id,
			session_token_hash: sessionTokenHash,
			expires_at: expiresAt,
		});

		return {
			session_token: sessionToken,
			expires_at: expiresAt,
			user: UserModel.UserPublicSchema.parse(user),
		};
	}

	static async getMe(
		sessionToken: string,
	): Promise<UserModel.UserPublicSessionDto> {
		const hashedSession = hashSessionToken(sessionToken);
		const session = await SessionRepository.findByToken(hashedSession);
		if (!session) throw new UnauthorizedException();
		const time = new Date(session.expires_at);
		const timeAsNum = time.getTime();
		const updatedExpiresAt = await SessionRepository.updateTime(
			session.id,
			timeAsNum,
		);
		// Session was expired and deleted
		if (!updatedExpiresAt) throw new UnauthorizedException();
		return {
			expires_at: updatedExpiresAt,
			session_token: sessionToken,
			user: UserModel.UserPublicSchema.parse(session.user),
		};
	}

	static async signOut(sessionToken: string) {
		const hashedSession = hashSessionToken(sessionToken);
		const session = await SessionRepository.findByToken(hashedSession);
		if (!session) throw new UnauthorizedException();
		await SessionRepository.deleteSessionById(session.id);
	}

	static async findAll() {
		return await UserRepository.findAll();
	}
}
