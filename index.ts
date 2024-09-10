import { loop } from "./src/loop";
import { runServer } from "./src/server";
import { redis } from "./src/service";

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
