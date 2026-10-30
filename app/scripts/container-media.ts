// The `@custom-media` names in tokens.css, for `@container` rules too: postcss-custom-media turns
// `@media (--narrow)` into plain CSS, but leaves `@container (--tiny)` alone, and browsers can't
// read it. Runs before postcss-custom-media, which then removes the names (postcss.config.js).
import type { PluginCreator } from "postcss";

export const containerMedia: PluginCreator<void> = () => ({
  postcssPlugin: "container-media",
  prepare() {
    const names = new Map<string, string>();
    return {
      Once(root) {
        root.walkAtRules("custom-media", (rule) => {
          const [name = "", ...query] = rule.params.trim().split(/\s+/);
          names.set(name, query.join(" "));
        });
      },
      AtRule: {
        container(rule) {
          rule.params = rule.params.replace(/\((--[\w-]+)\)/g, (_, name: string) => {
            const query = names.get(name);
            if (!query) throw rule.error(`No @custom-media ${name} in tokens.css`);
            return query;
          });
        },
      },
    };
  },
});
containerMedia.postcss = true;
