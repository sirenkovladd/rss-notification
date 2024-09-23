import KoaBase from "koa";
import { addRoute, createRouter, findRoute } from "rou3";
export type { Context } from "koa";

type Route = {
  handler: (ctx: KoaBase.Context) => unknown;
};

export class Koa {
  app;
  router;

  constructor(opt: ConstructorParameters<typeof KoaBase>[0]) {
    this.app = new KoaBase(opt);
    this.router = createRouter<Route>();
  }

  use(middleware: KoaBase.Middleware) {
    return this.app.use(middleware);
  }

  listen(port: number) {
    this.app.use(async (ctx: KoaBase.Context, next: KoaBase.Next) => {
      const route = findRoute(this.router, ctx.method, ctx.path);
      if (route) {
        await route.data.handler(ctx);
        return;
      }
      next();
    });
    return this.app.listen(port);
  }

  add(method: string, path: string, body: Route) {
    addRoute(this.router, method, path, body);
  }
}
