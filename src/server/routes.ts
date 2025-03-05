import type { RouterTypes } from "bun";
import Cookie from "cookie";
import { loginPage, mainScript, styleCss } from "../server/macros.ts" with {
	type: "macro",
};
import { deleteToken, signToken, verifyToken } from "../service";
import { isBodyLogin } from "../service/server";
import { userStorage } from "../service/storage";
import { mainPage } from "./dynamic.ts";

type UserType = {
	username: string;
	logout: () => Promise<void>;
};
const getUser = async (usernameToken: string): Promise<UserType | null> => {
	const [username, token] = usernameToken.split(":");
	if (username?.length && token?.length) {
		const user = await verifyToken(username, token);
		if (user) {
			return {
				username: user.username,
				logout: async () => {
					await deleteToken(username, token);
				},
			};
		}
	}
	return null;
};
const getUserMiddleware = async (req: Request) => {
	const token = Cookie.parse(req.headers.get("cookie") || "").token;
	if (token) {
		const user = await getUser(token);
		return user;
	}
	return null;
};

export const routes = {
	"/api/health": new Response("OK"),
	"/main.js": new Response(await mainScript()),
	"/style.css": new Response(await styleCss()),
	"/api/login": {
		POST: async (req) => {
			const body = req.json();
			if (!isBodyLogin(body)) {
				return new Response("Invalid request", { status: 400 });
			}
			const user = await userStorage.get(body.username);
			if (!user) {
				return new Response("Invalid username or password", { status: 401 });
			}
			if (!(await Bun.password.verify(body.password, user.password))) {
				return new Response("Invalid username or password", { status: 401 });
			}
			const token = await signToken({ username: user.username });
			return new Response("OK", {
				status: 200,
				// TODO add sign
				headers: { "Set-Cookie": `token=${token}; Max-Age=86400; Path=/` },
			});
		},
	},
	"/logout": async (req) => {
		const user = await getUserMiddleware(req);

		if (!user) {
			return new Response("Unauthorized", { status: 401 });
		}

		await user.logout();
		const res = Response.redirect("/");
		res.headers.append("Set-Cookie", "token=; Max-Age=0; Path=/");
		return res;
	},
	"/": async (req) => {
		const user = await getUserMiddleware(req);

		if (!user) {
			// html
			return new Response(await loginPage(), {
				headers: { "Content-Type": "text/html" },
			});
		}
		return new Response(await mainPage(user), {
			headers: { "Content-Type": "text/html" },
		});
	},
	"/*": Response.redirect("/"),
} satisfies Record<string, RouterTypes.RouteValue<string>>;
