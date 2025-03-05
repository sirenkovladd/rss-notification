import { types, type EarthquakeSetting } from "./feed-types";

export type DataEntry = {
	type: keyof typeof types;
} & EarthquakeSetting;

const cache: Record<
	string,
	{
		headers: Record<string, string>;
		values: Awaited<ReturnType<Response["json"]>>;
	}
> = {};

export async function cachedFetch(url: string) {
	const req = await fetch(url, {
		headers: {
			...cache[url]?.headers,
		},
	});
	if (req.status === 304) {
		return cache[url]?.values || [];
	}
	if (req.status >= 400) {
		throw new Error(`Request failed with error code ${req.status}`);
	}
	const body = await req.json();
	if (req.headers.has("last-modified")) {
		cache[url] = {
			headers: {
				"if-modified-since": req.headers.get("last-modified") || "",
			},
			values: body,
		};
	}
	return body;
}

export async function extract(url: string, details: DataEntry) {
	if (details.type in types) {
		const body = await cachedFetch(url);
		const parsed = types[details.type].parse(body, details);
		return parsed;
	}
	throw new Error(`Invalid type: ${details.type}`);
}
