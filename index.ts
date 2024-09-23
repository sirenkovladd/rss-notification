import { loop } from "./src/loop.ts";
import { runServer } from "./src/server/index.ts";
import { redis } from "./src/service.ts";

async function main() {
  let closeServer: (() => void) | undefined;
  try {
    closeServer = runServer();
    await loop();
  } catch (err) {
    console.log(err);
  }
  closeServer?.();
  await redis.quit();
}

main();
