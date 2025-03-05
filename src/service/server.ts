// export const koa = new Koa({
// 	keys: process.env.SIGN_COOKIES?.split(","),
// 	// asyncLocalStorage: true,
// });

export declare type BodyBase = number | string | object | File;
export declare type BodyArray = BodyBase[];
export interface BodyObject {
	[key: string]: BodyBase | BodyArray;
}
export declare type Body = BodyBase | BodyArray | BodyObject;

// export const baseRouter = koa.addRouter();

export function isBodyLogin(
	body: Body | undefined,
): body is { username: string; password: string } {
	return (
		typeof body === "object" &&
		body !== null &&
		"username" in body &&
		"password" in body &&
		typeof body.username === "string" &&
		typeof body.password === "string"
	);
}
