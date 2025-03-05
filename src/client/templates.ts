import type { VanObj } from "mini-van-plate/shared";
import van from "mini-van-plate/van-plate";
import type { TokenPayload } from "../service/storage";

const { br, a, header, div } = van.tags;

export function LoginForm(vanObj: VanObj, onSubmit?: (e: Event) => void) {
	const { form, div, br, input, a } = vanObj.tags;
	return form(
		{
			class: "genericform",
			method: "post",
			enctype: "multipart/form-data",
			...(onSubmit ? { onsubmit: onSubmit } : { action: "dologin.php" }),
		},
		"Username: ",
		br(),
		input({ class: "stylized", type: "text", name: "username", required: "" }),
		br(),
		br(),
		"Password: ",
		br(),
		input({
			class: "stylized",
			type: "password",
			name: "password",
			required: "",
		}),
		br(),
		br(),
		br(),
		input({ type: "submit", value: "Login", name: "submit" }),
		br(),
		br(),
		div(
			{ style: "font-size: 16px; font-family: &quot;Helvetica&quot;" },
			"Don't have an account?",
			a({ class: "linkbutton", href: "register.php" }, " Sign up "),
			br(),
			a(
				{ class: "linkbutton", href: "forgotpassword.php" },
				"Forgot your password?",
			),
		),
	);
}

export function LoginPage() {
	const body = div(
		div({ class: "hometab" }, a({ class: "homebutton", href: "/" }, "Home")),
		header(div({ class: "welcome" }, "User Login")),
		br(),
		br(),
		div({ class: "notesmall" }, "Welcome back"),
		br(),
		LoginForm(van),
	);

	return body.render().slice(5, -6);
}

function Header(
	vanObj: VanObj,
	user: TokenPayload,
	logout?: () => void,
	home?: () => void,
) {
	const { div, a, header } = vanObj.tags;
	return header(
		div(
			{ class: "hometab" },
			a({ class: "homebutton", href: "/", ...(home ? { home } : {}) }, "Home"),
			a(
				{ class: "homebutton", href: "/logout", ...(logout ? { logout } : {}) },
				"Logout",
			),
		),
		div({ class: "welcome" }, `Welcome, ${user.username}`),
	);
}

export type NotificationItem = {
	type: string;
	id: string;
	name: string;
};

export type HomeMainType = {
	list: NotificationItem[];
};

export function ItemRender(vanObj: VanObj, data: NotificationItem) {
	const { div, a, header } = vanObj.tags;
	return div(
		header(div({ class: "welcome" }, "Notifications")),
		div({ class: "notesmall" }, "Here are your notifications"),
		div(
			{ class: "notificationlist" },
			a(
				{ href: `/item/${data.id}` },
				div({ class: "notificationitem" }, data.name),
			),
		),
	);
}

export function HomeMain(vanObj: VanObj, data: HomeMainType) {
	const { div, a, header } = vanObj.tags;
	return div(
		header(div({ class: "welcome" }, "Notifications")),
		div({ class: "notesmall" }, "Here are your notifications"),
		div(
			{ class: "notificationlist" },
			data.list.map((item) =>
				a(
					{ href: `/item/${item.id}` },
					div({ class: "notificationitem" }, item.name),
				),
			),
		),
	);
}

export function HomePage(user: TokenPayload, data: HomeMainType) {
	return div(Header(van, user), HomeMain(van, data)).render().slice(5, -6);
}
