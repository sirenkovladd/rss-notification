import { requireEnv } from "./helpers";

const telegramToken = requireEnv("TELEGRAM_TOKEN");

export async function sendTelegram(body: unknown) {
	const result = await fetch(
		`https://api.telegram.org/bot${telegramToken}/sendMessage`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		},
	);
	return result;
}
