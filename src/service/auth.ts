import crypto from "node:crypto";
import { requireEnv } from "./helpers";
import { type TokenPayload, tokenStorage } from "./storage";

const tokenSecret = requireEnv("TOKEN_SECRET");
const keySecret = Buffer.from(tokenSecret, "base64url").subarray(0, 32);
const ivSecret = Buffer.from(tokenSecret, "base64url").subarray(32, 48);

export async function signToken(payload: TokenPayload) {
	const random = crypto.randomBytes(31).toString("base64url");
	const cipher = crypto.createCipheriv("aes-256-cbc", keySecret, ivSecret);
	const token =
		cipher.update(random, "base64url", "base64url") + cipher.final("base64url");
	await tokenStorage.set(payload.username, random, payload, 24 * 60 * 60);
	return `${payload.username}:${token}`;
}

export async function verifyToken(
	username: string,
	token: string,
): Promise<TokenPayload | null> {
	let random: string;
	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			keySecret,
			ivSecret,
		);
		random =
			decipher.update(token, "base64url", "base64url") +
			decipher.final("base64url");
	} catch (e) {
		console.log(e);
		return null;
	}

	const payload = await tokenStorage.get(username, random);
	if (payload === null) {
		return null;
	}
	return payload;
}

export async function deleteToken(username: string, token: string) {
	let random: string;
	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			keySecret,
			ivSecret,
		);
		random =
			decipher.update(token, "base64url", "base64url") +
			decipher.final("base64url");
	} catch (e) {
		console.log(e);
		return null;
	}

	await tokenStorage.del(username, random);
}
