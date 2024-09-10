import type Koa from "koa";
import { addRoute, createRouter, findRoute } from "rou3";

type Route = {
  handler: (ctx: Koa.Context) => unknown;
}

export class Router {
  router;
  constructor(app: Koa) {
    this.router = createRouter<Route>();
    app.use(this.use.bind(this))
  }

  add(method: string, path: string, body: Route) {
    addRoute(this.router, method, path, body)
  }

  private async use(ctx: Koa.Context, next: Koa.Next) {
    const route = findRoute(this.router, ctx.method, ctx.path)
    if (route) {
      ctx.body = await route.data.handler(ctx);
      return;
    }
    next();
  }
}
