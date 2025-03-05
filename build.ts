// "bun build --target=bun index.ts | gzip -9 > index.js.gz"
const result = await Bun.build({
  entrypoints: ["./index.ts"],
  // target: "bun",
});

console.log(result);

// if (result.success) {
//   console.log('OK');
//   // console.log(await result.outputs[0].text());
//   Bun.write(result.outputs[0].path, Bun.gzipSync(await result.outputs[0].text()));
// } else {
//   console.error(...result.logs);
// }
