import { htmlTemplate } from './staticFile' with { type: "macro" };

type UserType = {}
function template(body: string) {
  return htmlTemplate().replace('<ssr></ssr>', body);
}

export function mainPage(user?: UserType) {
  return template('Nice');
}
