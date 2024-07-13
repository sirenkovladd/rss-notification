import { extract } from "@extractus/feed-extractor";
import { setTimeout } from "node:timers/promises";
import { createClient } from "redis";

const debug = console.log;

const requireEnv = (name: string) => {
	const value = process.env[name];
	if (value === undefined) {
		throw new Error(`Missing environment variable ${name}`);
	}
	return value;
};

const client = await createClient({
	password: requireEnv("REDIS_PASSWORD"),
	socket: {
		host: requireEnv("REDIS_HOST"),
		port: +requireEnv("REDIS_PORT"),
	},
})
	.on("error", (err) => console.log("Redis Client Error", err))
	.connect();

debug("Connected to Redis");

const { promise, resolve } = Promise.withResolvers();
let rssList: Record<string, string[]>;
client.get("rssList").then((value) => {
	rssList = JSON.parse(value ?? "{}");
	debug("Got rssList", rssList);
	resolve();
});
const subscriber = client.duplicate();
await subscriber.connect();
subscriber.subscribe("rssList", async () => {
	const value = await client.get("rssList");
	rssList = JSON.parse(value ?? "{}");
	debug("Got new rssList", rssList);
});

const telegramToken = requireEnv("TELEGRAM_TOKEN");

async function sendUserMessage(userId, entry, rss) {
	// const { entries, ...rssOptions } = rss;
	debug("Sending message to", userId, entry, rss.title, rss.description);
	const text = `📰 ${rss.title}\n${entry.title}\n${entry.link}`;
	const result = await fetch(
		`https://api.telegram.org/bot${telegramToken}/sendMessage`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				chat_id: userId,
				text,
				// parse_mode: "HTML",
				// disable_web_page_preview: true,
				// disable_notification: true,
				// reply_markup: {
				// 	inline_keyboard: [
				// 		[
				// 			{
				// 				text: "🔗 Open",
				// 				url: entry.link,
				//       }
				//     ]
				//   ]
				// }
			}),
		},
	);
	debug("Sent message ", result.status, await result.text());
}

async function loop() {
	await promise;
	while (true) {
		const keys = [...new Set(Object.values(rssList).flat())];
		if (keys.length !== 0) {
			debug("Got keys", keys);
			const values = await client.mGet(keys.map((v) => `rss:${v}`));
			debug("Got values", values);
			const lastIds = keys.reduce(
				(acc, key, i) => {
					const value = values[i];
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string>,
			);
			const result = Object.fromEntries(
				(
					await Promise.all(
						Object.entries(lastIds).map(async ([key, value]) => {
							debug("Extracting", key);
							const rss = await extract(key);
							debug("Extracted", key, rss.entries?.length);
							const newItems =
								rss.entries?.slice(
									0,
									rss.entries.findIndex((v) => v.id === value),
								) ?? [];
							debug("New items", newItems.length);
							return [
								key,
								{
									newItems,
									rss,
								},
							] as const;
						}),
					)
				).filter(([, value]) => value.newItems.length > 0),
			);
			await Promise.all(
				Object.entries(rssList).map(async ([key, value]) => {
					for await (const entry of value) {
						if (!result[entry]) {
							continue;
						}
						for await (const item of result[entry].newItems) {
							await sendUserMessage(key, item, result[entry].rss);
						}
					}
				}),
			);
			const listUpdated: [string, string][] = Object.entries(result).map(
				([url, values]) => [`rss:${url}`, values.rss.entries?.[0]?.id],
			);
			if (listUpdated.length > 0) {
				await client.mSet(listUpdated);
			}
		}

		debug("Sleeping");
		await setTimeout(1000 * 60);
	}
}

async function main() {
	try {
		await loop();
	} catch (err) {
		console.log(err);
	}
	await client.quit();
	await subscriber.quit();
}

main();
