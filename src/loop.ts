import { extractFromXml, type FeedData, type FeedEntry } from "@extractus/feed-extractor";
import { setTimeout } from "node:timers/promises";
import type { PushSubscription } from "web-push";
import { rss as rssConfig } from "../config.json" assert { type: "json" };
import { logger, redis, sendTelegram, webpush } from "./service.ts";

logger.debug("Connected to Redis");

const lastEtag: Record<string, Record<string, string>> = {};

async function extract(url: string) {
  const headers = {
    ...lastEtag[url],
  };
  const res = await fetch(url, { headers });
  const status = res.status;
  if (status === 304) {
    return {
      entries: [],
    };
  }
  if (status >= 400) {
    throw new Error(`Request failed with error code ${status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  const buffer = await res.arrayBuffer();
  const text = buffer ? Buffer.from(buffer).toString().trim() : "";

  if (/(\+|\/)(xml|html)/.test(contentType)) {
    lastEtag[url] = {
      "if-none-match": res.headers.get("etag") || "",
      "if-modified-since": res.headers.get("last-modified") || "",
    };
    // console.log(text);
    try {
      return extractFromXml(text);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  throw new Error(`Invalid content type: ${contentType}`);
}

async function sendUserMessage(userId: number, entry: FeedEntry, rss: FeedData) {
  // const { entries, ...rssOptions } = rss;
  logger.debug({ userId, entry, title: rss.title, description: rss.description }, "Sending message");
  const text = `📰 ${rss.title}\n${entry.title}\n${entry.link}`;
  const result = await sendTelegram({
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
  });
  logger.debug({ status: result.status, text: await result.text() }, "Sent message");
}

export async function sendWebApi(subscription: PushSubscription, item: FeedEntry, rss: FeedData) {
  const dataToSend = JSON.stringify({
    title: item.title,
    rss: rss.title,
    link: item.link,
  });
  const result = await webpush.sendNotification(subscription, dataToSend);
  logger.debug({ result }, "Sent web push");
}

async function notify(subscribers: (typeof rssConfig)[keyof typeof rssConfig], newItem: FeedEntry, rss: FeedData) {
  for await (const subscriber of subscribers.telegram) {
    await sendUserMessage(subscriber, newItem, rss);
  }
  for await (const subscriber of subscribers["web-push"]) {
    await sendWebApi(subscriber, newItem, rss);
  }
  logger.debug("Notified");
}

let warmed = false;
export async function loop() {
  while (true) {
    const keys = Object.keys(rssConfig);
    if (keys.length !== 0) {
      logger.debug({ keys }, "Got keys");
      const values = await redis.mGet(keys.map((v) => `rss:${v}`));
      logger.debug({ values }, "Got values");
      const lastIds = keys.reduce(
        (acc, key, i) => {
          const value = values[i];
          value && (acc[key] = value);
          return acc;
        },
        {} as Record<string, string>,
      );
      const result = Object.fromEntries(
        (
          await Promise.all(
            Object.entries(lastIds).map(async ([key, value]) => {
              logger.debug({ key }, "Extracting");
              const rss = await extract(key);
              if (!rss) {
                return [key, undefined] as const;
              }
              // rss.entries?.forEach(r => console.log(r.title))
              logger.debug({ key, length: (rss.entries as FeedEntry[])?.length }, "Extracted");
              const newItems =
                (rss.entries as FeedEntry[])?.slice(
                  0,
                  (rss.entries as FeedEntry[]).findIndex((v) => v.id === value),
                ) ?? [];
              logger.debug({ length: newItems.length }, "New items");
              return [
                key,
                {
                  newItems,
                  rss,
                },
              ] as const;
            }),
          )
        ).filter((v) => !!v[1]),
      );
      if (warmed) {
        await Promise.all(
          Object.entries(rssConfig).map(async ([key, value]) => {
            for await (const item of result[key].newItems) {
              await notify(value, item, result[key].rss);
            }
          }),
        );
      } else {
        warmed = true;
      }
      const listUpdated: [string, string][] = Object.entries(result)
        .filter(([, { newItems, rss }]) => newItems.length > 0)
        .map<[string, string | undefined]>(([url, values]) => [`rss:${url}`, values.rss.entries?.[0]?.id])
        .filter((arr): arr is [string, string] => !!arr[1]);
      if (listUpdated.length > 0) {
        logger.debug({ listUpdated }, "Updating list");
        await redis.mSet(listUpdated);
      }
    }

    logger.debug("Sleeping");
    await setTimeout(1000 * 60);
  }
}
