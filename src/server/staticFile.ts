import { readFileSync } from "node:fs";

export function htmlTemplate() {
	return readFileSync("./src/client/index.html", "utf8");
}
