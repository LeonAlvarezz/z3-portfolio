import z from "zod";
import { BaseModel } from "@/core/model/base.model";

export namespace UserModel {
	export enum RoleEnum {
		User = "User",
		Admin = "Admin",
	}
	export const UserSchema = BaseModel.BaseRowSchema.extend({
		public_id: z.string(),
		email: z.email(),
		username: z.string(),
		avatar_url: z.url().nullable().optional(),
		last_login_at: z.iso.datetime().nullable().optional(),
		role_id: z.number(),
	});

	export const UpsertUserSchema = UserSchema.pick({
		email: true,
		username: true,
		last_login_at: true,
		public_id: true,
		updated_at: true,
		avatar_url: true,
		role_id: true,
	});

	export const UserPublicSchema = UserSchema.omit({
		last_login_at: true,
	});

	export const UserPublicSessionSchema = z.object({
		session_token: z.string(),
		expires_at: z.iso.datetime(),
		user: z.lazy(() => UserPublicSchema),
	});

	export type UserPublicDto = z.infer<typeof UserPublicSchema>;
	export type UpsertUserDto = z.infer<typeof UpsertUserSchema>;
	export type UserPublicSessionDto = z.infer<typeof UserPublicSessionSchema>;
}
