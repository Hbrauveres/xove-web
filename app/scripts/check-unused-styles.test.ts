import { describe, expect, it } from "vitest";
import { unusedStyles } from "./check-unused-styles.ts";

/** The findings for a set of files (paths relative to src), as `rule file name`. */
const found = (files: Record<string, string>) =>
  unusedStyles(new Map(Object.entries(files))).map((f) => `${f.rule} ${f.file} ${f.name}`);

const TOKENS = "shared/styles/tokens.css";

describe("the unused styles check", () => {
  describe("a CSS module's classes", () => {
    it("names a class its component never reads, and not one it reads by name or by key", () => {
      expect(
        found({
          "a/a.component.tsx": 'import styles from "./a.module.css";\nstyles.used; styles["keyed"];\n',
          "a/a.module.css": ".used { color: var(--x); }\n.keyed {}\n.unused:hover .used {}\n",
        }),
      ).toEqual(["unusedClass a/a.module.css unused"]);
    });

    it("takes every class as read where the module is read by a computed key", () => {
      expect(
        found({
          "b/b.component.tsx": 'import styles from "./b.module.css";\nstyles[size];\n',
          "b/b.module.css": ".small {}\n.large {}\n",
        }),
      ).toEqual([]);
    });

    it("takes every class as read where the module is handed on whole", () => {
      expect(
        found({
          "f/f.component.tsx": 'import styles from "./f.module.css";\nclassesOf(styles, variant);\n',
          "f/f.module.css": ".primary {}\n.ghost {}\n",
        }),
      ).toEqual([]);
    });

    it("counts what every file importing the module reads, under its own name", () => {
      expect(
        found({
          "c/c.component.tsx": 'import styles from "./c.module.css";\nstyles.one;\n',
          "c/c-part.component.tsx": 'import css from "../c/c.module.css";\ncss.two;\n',
          "c/c.module.css": ".one {}\n.two {}\n",
        }),
      ).toEqual([]);
    });

    it("leaves a stylesheet read as text, a global class, a number and a comment", () => {
      expect(
        found({
          "d/d.component.tsx": 'import styles from "./d.module.css";\nstyles.real;\n',
          "d/d.component.test.tsx": 'import css from "./d.module.css?raw";\n',
          "d/d.module.css": "/* .old was here */\n.real { width: 0.5rem; }\n:global(.theme) .real {}\n",
        }),
      ).toEqual([]);
    });

    it("reads a namespace import, and never takes a file name in a nested block for a class", () => {
      expect(
        found({
          "g/g.component.tsx": 'import * as styles from "./g.module.css";\nstyles.box;\n',
          "g/g.module.css": ".box {\n  background: url(./bg.png);\n  &:hover { background: url(./hover.png); }\n}\n",
        }),
      ).toEqual([]);
    });

    it("leaves a nested :global(…) whole, and reads on past a quote left open in a url", () => {
      expect(
        found({
          "h/h.component.tsx": 'import styles from "./h.module.css";\nstyles.a;\n',
          "h/h.module.css": ":global(.dark:not(.lite)) .a {}\n.a { background: url(it's.png); }\n.b {}\n",
        }),
      ).toEqual(["unusedClass h/h.module.css b"]);
    });

    it("names every class of a module nothing imports", () => {
      expect(found({ "e/e.module.css": ".lost {}\n" })).toEqual(["unusedClass e/e.module.css lost"]);
    });
  });

  describe("the tokens", () => {
    it("names a token nothing reads, and not one a stylesheet, another token or the code reads", () => {
      expect(
        found({
          [TOKENS]:
            ":root {\n  --red: #f00;\n  --accent: var(--red);\n  --gap: 1rem;\n  --size: 2rem;\n  --lost: 3rem;\n}\n",
          "a/a.module.css": ".a { color: var(--accent); margin: var(--gap); }\n",
          "a/a.component.tsx": 'import styles from "./a.module.css";\nstyles.a; getPropertyValue("--size");\n',
        }),
      ).toEqual(["unusedToken shared/styles/tokens.css --lost"]);
    });

    it("names a custom media no stylesheet uses, and not one that's used", () => {
      expect(
        found({
          [TOKENS]: "@custom-media --narrow (width < 40rem);\n@custom-media --tall (height > 60rem);\n",
          "a/a.module.css": "@media (--narrow) { .a {} }\n",
          "a/a.component.tsx": 'import styles from "./a.module.css";\nstyles.a;\n',
        }),
      ).toEqual(["unusedToken shared/styles/tokens.css --tall"]);
    });

    it("doesn't take a longer name for the token it starts with", () => {
      expect(
        found({
          [TOKENS]: ":root {\n  --space-1: 0.25rem;\n  --space-10: 2.5rem;\n}\n",
          "a/a.module.css": ".a { margin: var(--space-10); }\n",
          "a/a.component.tsx": 'import styles from "./a.module.css";\nstyles.a;\n',
        }),
      ).toEqual(["unusedToken shared/styles/tokens.css --space-1"]);
    });
  });
});
