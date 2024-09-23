import { readFileSync } from "fs";

export function htmlTemplate() {
  return readFileSync("./src/client/index.html", "utf8")
}
