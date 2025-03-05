import van from "vanjs-core";
import { LoginForm } from "./templates";

const hydrate = (dom: Element | null, f: (dom: Element) => Element) => dom && van.hydrate(dom, f);

const token = van.state(false);
const page = van.derive(() => token.val ? 'home' : 'login')

async function onSubmitLogin(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (response.status === 200) {
      token.val = true;
    }
  } catch (err) {
    console.error(err);
  }
  form.reset();
}

hydrate(document.querySelector(".genericform"), (dom) => {
  return page.val === 'home' ? 'qwe' : LoginForm(van, onSubmitLogin);
});
