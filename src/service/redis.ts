import { createClient } from "@redis/client";
import { requireEnv } from "./helpers";

export const redis = await createClient({
	password: requireEnv("REDIS_PASSWORD"),
	socket: {
		host: requireEnv("REDIS_HOST"),
		port: +requireEnv("REDIS_PORT"),
	},
})
	.on("error", (err) => console.log("Redis Client Error", err))
	.connect();
