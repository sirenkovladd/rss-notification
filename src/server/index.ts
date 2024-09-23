import { createHash, randomBytes, type Hash } from "node:crypto";
import { Stream } from "node:stream";
import { logger, redis, serverPort, signToken, verifyToken, type TokenPayload } from "../service.ts";
import { Koa, type Context } from "./koa.ts";
import { loginPage, mainScript, styleCss } from "./macros.ts" with { type: "macro" };
import { mainPage } from "./dynamic.ts";

const koa = new Koa({
  keys: process.env.SIGN_COOKIES?.split(','),
});

koa.use(async (ctx, next) => {
  // Logger
  const id = randomBytes(20).toString("base64url");
  logger.debug(`${ctx.method} ${ctx.url} ${ctx.request.ip} ${id}`);
  ctx.id = id;
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.debug(`${ctx.method} ${ctx.url} ${ctx.request.ip} ${id} - ${ms}ms ${ctx.response.status}`);
});

const updater = (hash: Hash, entity: string | Buffer): Hash => (typeof entity === "string" ? hash.update(entity, "utf8") : hash.update(entity));

function entitytag(entity: string | Buffer) {
  const hash = updater(createHash("sha1"), entity).digest("base64").substring(0, 27);
  const len = Buffer.byteLength(entity, "utf8");
  return '"' + len.toString(16) + "-" + hash + '"';
}

koa.use(async (ctx, next) => {
  await next();
  const body = ctx.body;
  if (!body || ctx.response.get("etag")) return;
  const status = (ctx.status / 100) | 0;
  if (status !== 2) return;
  if (body instanceof Stream) {
    return;
  } else if (typeof body === "string" || Buffer.isBuffer(body)) {
    ctx.response.etag = entitytag(body);
  } else {
    ctx.response.etag = entitytag(JSON.stringify(body));
  }
  if (ctx.response.etag === ctx.req.headers["if-none-match"]) {
    ctx.status = 304;
  }
});

koa.add("GET", "/api/health", {
  handler: () => new Response("OK"),
});

koa.add("POST", "/api/login", {
  handler: async (ctx) => {
    const body = await ctx.json();
    const userRaw = await redis.get(`user:${body.username}`);
    if (!userRaw) {
      return new Response("Invalid username or password", { status: 401 });
    }
    const user = JSON.parse(userRaw);
    if (!(await Bun.password.verify(body.password, user.password))) {
      return new Response("Invalid username or password", { status: 401 });
    }
    const token = await signToken({ username: user.username });
    return new Response(JSON.stringify({ token }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});

const getUser = async (ctx: Context): Promise<TokenPayload | null> => {
  const authHeader = ctx.req.headers["Authorization"];
  if (typeof authHeader !== "string") {
    return null;
  }
  const [schema, usernameToken] = authHeader.split(" ");
  if (schema !== "AES256") {
    return null;
  }
  const [username, token] = usernameToken.split(":");
  if (username.length && token.length) {
    const user = await verifyToken(username, token);
    return user;
  }
  return null;
};

koa.add("GET", "/main.js", {
  handler: async (ctx) => {
    ctx.body = await mainScript();
  },
});

koa.add("GET", "/style.css", {
  handler: async (ctx) => {
    ctx.body = await styleCss();
  },
});

koa.add("GET", "/", {
  handler: async (ctx) => {
    const token = ctx.cookies.get("token", { signed: true });
    console.log("ctx", token);
    ctx.body = await loginPage()
    ctx.cookies.set("token", "test", {  })
  },
});

export function runServer() {
  const server = koa.listen(serverPort);
  return () => {
    server.close();
  };
}
