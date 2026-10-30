import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { containerMedia } from "./container-media.ts";

const run = (css: string) => postcss([containerMedia()]).process(css, { from: undefined }).css;
const NAMES = "@custom-media --tiny (max-width: 22.4375rem);\n@custom-media --short (max-height: 20rem);\n";

describe("named sizes in container rules", () => {
  it("turns each name into the size it stands for", () => {
    expect(run(`${NAMES}@container (--tiny) { .a { gap: 0 } }`)).toContain("@container (max-width: 22.4375rem) {");
    expect(run(`${NAMES}@container stage (--short) { .a { gap: 0 } }`)).toContain(
      "@container stage (max-height: 20rem) {",
    );
  });

  it("refuses a name tokens.css doesn't define, instead of a rule no browser reads", () => {
    expect(() => run(`${NAMES}@container (--huge) { .a { gap: 0 } }`)).toThrow("No @custom-media --huge");
  });
});
