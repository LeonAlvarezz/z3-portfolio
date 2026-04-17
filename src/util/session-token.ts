export function generateSessionToken(): string {
	return Bun.randomUUIDv7("base64url");
}
export function hashSessionToken(token: string): string {
	const hasher = new Bun.CryptoHasher("sha256");
	return hasher.update(token, "utf8").digest("hex");
}
