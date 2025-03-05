import { logger } from "./logger";
import { redis } from "./redis";

class Storage {
	name: string;

	constructor(name: string, redisClient: typeof redis) {
		this.name = name;
	}

	async get(key: string) {
		return await redis.get(`${this.name}:${key}`);
	}

	async getMulti(keys: string[]) {
		return await redis.mGet(keys.map((v) => `${this.name}:${v}`));
	}

	async set(key: string, value: string, expire?: number) {
		return await redis.set(`${this.name}:${key}`, value, { EX: expire });
	}

	async setMulti(data: [string, string][]) {
		if (data.length === 0) {
			return;
		}
		return await redis.mSet(
			data.map(([key, value]) => [`${this.name}:${key}`, value]),
		);
	}

	async del(key: string) {
		return await redis.del(`${this.name}:${key}`);
	}
}

export type UserType = {
	username: string;
	password: string;
};

class UserStorage {
	storage: Storage;

	constructor(redisClient: typeof redis) {
		this.storage = new Storage("user", redisClient);
	}

	async get(key: string): Promise<UserType | null> {
		const userRaw = await this.storage.get(key);
		if (!userRaw) {
			return null;
		}
		return JSON.parse(userRaw);
	}
}

export type TokenPayload = {
	username: string;
};

class TokenStorage {
	storage: Storage;

	constructor(redisClient: typeof redis) {
		this.storage = new Storage("token", redisClient);
	}

	async get(username: string, key: string): Promise<TokenPayload | null> {
		const tokenRaw = await this.storage.get(`${username}:${key}`);
		if (!tokenRaw) {
			return null;
		}
		try {
			return JSON.parse(tokenRaw);
		} catch (e) {
			logger.error({ e, tokenRaw, key, username }, "Failed to parse token");
			return null;
		}
	}

	async set(
		username: string,
		key: string,
		value: TokenPayload,
		expire?: number,
	) {
		return await this.storage.set(
			`${username}:${key}`,
			JSON.stringify(value),
			expire,
		);
	}

	async del(username: string, key: string) {
		return await this.storage.del(`${username}:${key}`);
	}
}

class DataStorage {
	storage: Storage;

	constructor(redisClient: typeof redis) {
		this.storage = new Storage("data", redisClient);
	}

	async getMulti(keys: string[]): Promise<Record<string, string>> {
		const dataRaw = await this.storage.getMulti(keys);
		return Object.fromEntries(
			dataRaw.filter((e): e is string => !!e).map((v, i) => [keys[i], v]),
		);
	}

	async setMulti(data: [string, string][]) {
		return await this.storage.setMulti(data);
	}
}

export const userStorage = new UserStorage(redis);
export const tokenStorage = new TokenStorage(redis);
export const dataStorage = new DataStorage(redis);
