import { HomePage } from "../client/templates";
import type { TokenPayload } from "../service/storage";
import { htmlTemplate } from "./staticFile" with { type: "macro" };

function template(body: string) {
	return htmlTemplate().replace("<ssr></ssr>", body);
}

export async function mainPage(user: TokenPayload) {
	const list = [{ type: "notification", id: "1", name: "Notification 1" }];
	return HomePage(user, { list });
}
