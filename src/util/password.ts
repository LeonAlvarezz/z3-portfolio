import env from "@/lib/env";

export async function hashPassword(password: string) {
	return await Bun.password.hash(password, {
		algorithm: env.HASH_PASSWORD_ALGORITHM,
		cost: env.HASH_PASSWORD_COST,
	});
}

export async function verifyPassword(password: string, hasedPassword: string) {
	return await Bun.password.verify(password, hasedPassword);
}
