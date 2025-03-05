import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { sleepInterval } from "./env";
import { extract, type DataEntry } from "./feedreader/excractor";
import { notify, type Notify } from "./feedreader/notification";
import { logger } from "./service";
import { dataStorage } from "./service/storage";

type JsonConfig = DataEntry & Notify;
type JsonConfigObj = Record<string, JsonConfig>;

async function getConfig(): Promise<JsonConfigObj> {
	const config = await readFile("./config.json", "utf8");
	return JSON.parse(config).json;
}

let warmed = false;
export async function loop() {
	while (true) {
		const config = await getConfig();
		const keys = Object.keys(config);
		if (keys.length !== 0) {
			logger.debug({ keys }, "Got keys");
			const lastIds = await dataStorage.getMulti(keys);
			logger.debug({ lastIds }, "Got lastIds");
			const result = Object.fromEntries(
				(
					await Promise.all(
						keys.map(async (key) => {
							const lastId = lastIds[key];
							const data = await extract(key, config[key]);
							if (lastId) {
								return [key, data.filter((v) => v.id > +lastId)] as const;
							}
							return [key, data] as const;
						}),
					)
				).filter((v) => v[1].length),
			);
			if (warmed) {
				await Promise.all(
					Object.entries(result).map(async ([key, value]) => {
						for await (const item of result[key]) {
							await notify(config[key], item);
						}
					}),
				);
			} else {
				warmed = true;
			}

			const listUpdated = Object.entries(result).map<[string, string]>(
				([url, values]) => [
					url,
					values
						.map((v) => v.id)
						.sort((a, b) => b - a)[0]
						.toString(),
				],
			);
			console.log(JSON.stringify(result), listUpdated);
			logger.debug({ listUpdated }, "Updating list");
			await dataStorage.setMulti(listUpdated);
		}

		logger.debug("Sleeping");
		await setTimeout(1000 * sleepInterval);
	}
}
