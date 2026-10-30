// The window and box sizes the layouts change at are named once, in tokens.css (`@custom-media
// --narrow …`), and used as `@media (--narrow)` or `@container (--tiny)`. Browsers don't read those
// names yet: these turn them into plain CSS at build time. global-data lets every CSS module see the
// names without importing tokens.css.
import globalData from "@csstools/postcss-global-data";
import customMedia from "postcss-custom-media";
import { fileURLToPath } from "node:url";
import { containerMedia } from "./scripts/container-media.ts";

export default {
  plugins: [
    globalData({ files: [fileURLToPath(new URL("./src/shared/styles/tokens.css", import.meta.url))] }),
    containerMedia(),
    customMedia(),
  ],
};
