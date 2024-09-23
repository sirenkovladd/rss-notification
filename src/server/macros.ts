import { htmlTemplate } from './staticFile';
import { readFileSync } from 'node:fs';
// import van from 'mini-van-plate/van-plate'
import { LoginPage } from '../client/templates';

export async function loginPage() {
  // const rewriter = new HTMLRewriter();

  // rewriter.on("ssr", {
  //   element(el) {
  //     const newContent = LoginPage(van).render().slice(5, -6);
  //     el.replace(newContent, { html: true });
  //   },
  // });

  return htmlTemplate().replace('<ssr></ssr>', LoginPage());
}

// export const mainPage = {

// }

export async function mainScript() {
  const result = await Bun.build({
    entrypoints: ["./src/client/main.ts"],
  });
  if (result.success) {
    return await result.outputs[0].text();
  }
  console.error(...result.logs);
}

export async function styleCss() {
  const body = readFileSync("./src/client/style.css", "utf8");
  return body;
}
