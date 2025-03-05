import { serve } from "bun";
import { serverPort } from "../env.ts";
import { routes } from "./routes.ts";

export function runServer() {
	const server = serve({
		port: serverPort,
		routes,
	});

	return () => {
		server.stop();
	};
}
