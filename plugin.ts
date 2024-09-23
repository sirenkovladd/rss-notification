import type { BunPlugin } from "bun";

export const plugin: BunPlugin = {
  name: "rss",
  setup: async (build) => {
    build.onLoad({ filter: /\.ts/ }, async (args) => {
      // console.log(args);
      const text = (await Bun.file(args.path).text()).replace(/ with \{ type: "macro" \}/, "");
      // console.log(text);
      return { contents: text, loader: "tsx" };
    });
  },
};

Bun.plugin(plugin);
