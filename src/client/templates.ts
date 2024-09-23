import van from 'mini-van-plate/van-plate'
import {type VanObj } from 'mini-van-plate/shared'

const { br, a, header, div } = van.tags

export function LoginForm(vanObj: VanObj, onSubmit?: (e: Event) => void) {
  const { form, div, br, input, a } = vanObj.tags
  return form(
    { class: "genericform", method: "post", enctype: "multipart/form-data", ...(onSubmit ? { onsubmit: onSubmit } : {action: "dologin.php"} )},
    "Username: ",
    br(),
    input({ class: "stylized", type: "text", name: "username", required: "" }),
    br(),
    br(),
    "Password: ",
    br(),
    input({ class: "stylized", type: "password", name: "password", required: "" }),
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
      a({ class: "linkbutton", href: "forgotpassword.php" }, "Forgot your password?")
    )
  )
}

export function LoginPage() {
  const body = div(
    div(
      { class: "hometab" },
      a({ class: "homebutton", href: "/" }, "Home"),
    ),
    header(div({ class: "welcome" }, "User Login")),
    br(),
    br(),
    div({ class: "notesmall" }, "Welcome back"),
    br(),
    LoginForm(van),
  );

  return body.render().slice(5, -6);
}
