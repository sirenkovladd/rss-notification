import type { PushSubscription } from "web-push";
import { logger, sendTelegram, webpush } from "../service";
import type { FeedResult } from "./feed-types";

async function sendUserMessage(userId: number, entry: FeedResult) {
	logger.debug(
		{ userId, id: entry.id, entry: entry.content.join("\n") },
		"Sending message",
	);
	const result = await sendTelegram({
		chat_id: userId,
		text: entry.content.join("\n"),
	});
	logger.debug(
		{ status: result.status, text: await result.text() },
		"Sent message",
	);
}

async function sendWebApi(subscription: PushSubscription, item: FeedResult) {
	const dataToSend = JSON.stringify({
		title: item.details.title,
		rss: item.content.join("\n"),
		link: item.content.at(-1),
	});
	const result = await webpush.sendNotification(subscription, dataToSend);
	logger.debug({ result }, "Sent web push");
}

type APIParams = {
	endpoint: string;
	method?: string;
};

async function sendApi(params: APIParams, item: FeedResult) {
	const method = params.method || "POST";
	const result = await fetch(params.endpoint, {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		body: ["GET", "HEAD", "OPTIONS"].includes(method)
			? undefined
			: JSON.stringify({
					title: item.details.title,
					content: item.content.join("\n"),
					link: item.content.at(-1),
				}),
	});
	if (result.status === 200) {
		logger.debug("Sent API");
	} else {
		logger.error({ status: result.status, text: await result.text() });
	}
}

export type Notify = {
	telegram: number[];
	"web-push": PushSubscription[];
	api: APIParams[];
};

export async function notify(subscribers: Notify, newItem: FeedResult) {
	logger.debug({ newItem }, "Notifying");
	for await (const subscriber of subscribers.telegram || []) {
		await sendUserMessage(subscriber, newItem);
	}
	for await (const subscriber of subscribers["web-push"] || []) {
		await sendWebApi(subscriber, newItem);
	}
	for await (const subscriber of subscribers.api || []) {
		await sendApi(subscriber, newItem);
	}
	logger.debug("Notified");
}
