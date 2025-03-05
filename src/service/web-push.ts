import webpush from "web-push";
import { requireEnv } from "./helpers";

webpush.setVapidDetails(
	requireEnv("VAPID_SUBJECT"),
	requireEnv("VAPID_PUBLIC_KEY"),
	requireEnv("VAPID_PRIVATE_KEY"),
);
export { webpush };
