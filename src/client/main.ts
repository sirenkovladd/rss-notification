import van from "vanjs-core";
import { LoginForm } from "./templates";

const { div } = van.tags;

const parseCookie = () => document.cookie.split(';').filter(v => v)
    .map(v => v.split('='))
    .reduce<Record<string, string>>((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});

const changeCookie = (name: string, val: string | null) => {
  const cookie = parseCookie();
  if (val === null) {
    delete cookie[name];
  } else {
    cookie[name] = val;
  }
  document.cookie = Object.entries(cookie).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join(';');
};

const token = van.state(JSON.parse(parseCookie().token || "null"));
const page = van.derive(() => token.val ? 'home' : 'login')

async function onSubmitLogin(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  console.log(username, password);
  token.val = { username, password };
  changeCookie('token', JSON.stringify(token.val));
  form.reset();
}

van.hydrate(document.querySelector(".genericform")!, (dom) => {
  return page.val === 'home' ? 'qwe' : LoginForm(van, onSubmitLogin);
});
console.log(123);
