import Koa from 'koa';
import { redis, serverPort, signToken, verifyToken, type TokenPayload } from "../service";
import { Router } from "./koa";

const app = new Koa();

const router1 = new Router(app);

router1.add('GET', "/health", {
  handler: () => new Response("OK"),
})

router1.add('POST', "/login", {
  handler: async (ctx) => {
    const body = await ctx.json();
    const userRaw = await redis.get(`user:${body.username}`);
    if (!userRaw) {
      return new Response("Invalid username or password", { status: 401 });
    }
    const user = JSON.parse(userRaw);
    if (!await Bun.password.verify(body.password, user.password)) {
      return new Response("Invalid username or password", { status: 401 });
    }
    const token = await signToken({ username: user.username })
    return new Response(JSON.stringify({ token }), {
      headers: {
        "Content-Type": "application/json",
      }
    });
  },
})

const getUser = async (ctx: Koa.Context): Promise<TokenPayload | null> => {
  const authHeader = ctx.req.headers["Authorization"];
  if (typeof authHeader !== 'string') {
    return null;
  }
  const [schema, usernameToken] = authHeader.split(" ");
  if (schema !== "AES256") {
    return null;
  }
  const [username, token] = usernameToken.split(':');
  if (username.length && token.length) {
    const user = await verifyToken(username, token);
    return user;
  }
  return null;
}

router1.add('GET', "/", {
  handler: (ctx) => ctx.body = 'Hello world!',
});

export function runServer() {
  const server = app.listen(serverPort);
  return () => {
    server.close();
  };
  // const server = Bun.serve({
  //   port: serverPort,
  //   fetch(req) {
  //     const url = new URL(req.url);
  //     logger.debug({ url: url.pathname }, "Request received");
  //     // const route = router.lookup(url.pathname);
  //     const route = findRoute(router, req.method, url.pathname);
  //     if (route) {
  //       return route.handler(req);
  //     }
  //     return new Response("Not found", { status: 404 });
  //   },
  // });
  // return () => {
  //   server.stop();
  // };
}
