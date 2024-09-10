// import { accounts } from "./config.json";

import { signToken } from "./src/service";

// await sendWebApi(rssConfig["https://www.earthquakescanada.nrcan.gc.ca/cache/earthquakes/swbc-en.atom"]["web-push"][0],
//   {link: 'test', title: 'qwe13'},
//   {title: 'qweqwe'}
// )

console.log(await signToken({username: 'qwe'}))