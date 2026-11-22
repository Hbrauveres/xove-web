import { describe, expect, it } from "vitest";
import { analyse, historyInTooling, type Rule } from "./check-code.ts";

/** The rules one file breaks: its path relative to src, its text, and which other files exist. */
const rules = (path: string, text = "", others: string[] = []) =>
  analyse(path, text, (p) => others.includes(p)).map((f): Rule => f.rule);

describe("the code check", () => {
  it("finds nothing in a file that follows the rules", () => {
    expect(
      rules("shared/utils/clamp.util.ts", "export const clamp = (x: number) => x;\n", [
        "shared/utils/clamp.util.test.ts",
      ]),
    ).toEqual([]);
  });

  it("names a file outside the folders, a name without its type, and logic without a test", () => {
    expect(rules("components/ui/Thing.tsx", "export const Thing = () => null;\n")).toEqual([
      "structure",
      "naming",
      "noTest",
    ]);
  });

  it("takes the app's entry and its test by their own names, with no type to add", () => {
    expect(rules("main.tsx", "", ["main.test.tsx"])).not.toContain("naming");
    expect(rules("main.test.tsx", "")).not.toContain("naming");
    expect(rules("other.test.tsx", "")).toContain("naming");
  });

  it("takes a fake in testing/fakes/ and the tests' setup by name, and a fake nowhere else", () => {
    expect(rules("testing/fakes/api.fake.ts", "")).not.toContain("naming");
    expect(rules("testing/fakes/livekit-room.fake.ts", "")).not.toContain("naming");
    expect(rules("testing/setup.ts", "")).not.toContain("naming");
    expect(rules("testing/setup.test.tsx", "")).not.toContain("naming");
    expect(rules("testing/fakeApi.ts", "")).toContain("naming");
    expect(rules("testing/api.fake.ts", "")).toContain("naming");
    expect(rules("services/livekit-service/room.fake.ts", "")).toContain("naming");
    expect(rules("shared/utils/setup.ts", "")).toContain("naming");
  });

  it("names a fake over 300 lines", () => {
    expect(rules("testing/fakes/long.fake.ts", "x\n".repeat(301))).toContain("size");
  });

  it("names a file over 300 lines", () => {
    expect(rules("shared/utils/long.util.ts", "x\n".repeat(301), ["shared/utils/long.util.test.ts"])).toContain("size");
  });

  it("names a CSS value written with any unit, and a colour by its name, never a word that isn't one", () => {
    const css = (line: string) => rules("shared/components/a/a.component.module.css", `.a { ${line} }\n`);
    for (const unit of ["px", "rem", "em", "ch", "vw", "vh", "dvh", "svw", "cqw", "cqmin", "ms", "s"])
      expect(css(`width: 3${unit};`)).toContain("literal");
    expect(css("width: .5rem;")).toContain("literal");
    expect(css("margin: 0px;")).not.toContain("literal");
    for (const colour of ["red", "rebeccapurple", "yellowgreen"]) expect(css(`color: ${colour};`)).toContain("literal");
    expect(css('content: "i";')).not.toContain("literal");
    expect(css("font-family: i, serif;")).not.toContain("literal");
    expect(css("color: var(--red-50);")).not.toContain("literal");
  });

  it("names history in a test's title in the app, once per line", () => {
    const titled = rules("shared/utils/g.util.test.ts", 'describe("the dropdown (spec 0104)", () => {});\n', [
      "shared/utils/g.util.ts",
    ]);
    expect(titled.filter((r) => r === "history")).toHaveLength(1);
    const both = rules("shared/utils/g.util.test.ts", 'it("opens (#187)", () => {}); // see spec 0123\n', [
      "shared/utils/g.util.ts",
    ]);
    expect(both.filter((r) => r === "history")).toHaveLength(1);
    expect(
      rules("shared/utils/g.util.test.ts", 'expect(name("spec 0104")).toBe(true);\n', ["shared/utils/g.util.ts"]),
    ).not.toContain("history");
  });

  it("names history in a comment, LiveKit outside core, and a literal colour in CSS", () => {
    expect(
      rules("features/room/utils/a.util.ts", "// as decided in spec 0123\n", ["features/room/utils/a.util.test.ts"]),
    ).toContain("history");
    expect(
      rules("features/room/utils/b.util.ts", 'import { Room } from "livekit-client";\n', [
        "features/room/utils/b.util.test.ts",
      ]),
    ).toContain("livekit");
    expect(rules("shared/ui/face/face.component.module.css", ".face { color: #ffffff; }\n")).toContain("literal");
  });

  it("names every value a CSS file writes instead of a token: colour, size, timing, easing, layer, breakpoint", () => {
    const css = "shared/ui/face/face.component.module.css";
    for (const line of [
      ".a { background: rgba(0, 0, 0, 0.4); }",
      ".a { padding: 12px; }",
      ".a { width: 2.25rem; }",
      ".a { letter-spacing: 0.08em; }",
      ".a { margin: calc(var(--space-2) * -1) -4px; }",
      ".a { transition: opacity 120ms; }",
      ".a { animation: spin 1.6s infinite; }",
      ".a { transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); }",
      ".a { z-index: 20; }",
      ".a { z-index: -1; }",
      "@media (max-width: 760px) {",
      "@container (max-height: 320px) {",
      ".a { color: white; }",
      ".a { background: oklch(70% 0.1 30); }",
      ".a { border-color: color-mix(in srgb, var(--live) 45%, transparent); }",
      ".a { width: 92vw; max-width: 36ch; }",
      ".a { font-size: 12PT; }",
      ".a { z-index : 9; }",
      "  0 0 var(--space-2) red,",
    ])
      expect(rules(css, `${line}\n`), line).toContain("literal");
  });

  it("reads past comments, however they're laid out", () => {
    const css = "shared/ui/face/face.component.module.css";
    expect(rules(css, "/*\n  the old look: 12px, #fff\n*/\n.a { gap: var(--space-2); }\n")).not.toContain("literal");
  });

  it("lets CSS write tokens, zero and plain numbers, and lets tokens.css write every value", () => {
    const css = "shared/ui/face/face.component.module.css";
    for (const line of [
      ".a { padding: var(--space-2-5) var(--space-3); border: var(--hairline) solid var(--white-10); }",
      ".a { margin: 0; transition: visibility 0s linear var(--duration-180); z-index: 0; }",
      ".a { opacity: 0.5; line-height: 1.5; flex: 1; font-weight: 500; transform: scale(1.04); }",
      "@media (--narrow) {",
      "@container (--tiny) {",
      "/* was 12px before the tokens */",
      ".a { gap: var(--space-2); } /* was 8px */",
      ".a { white-space: nowrap; background: transparent; color: currentColor; width: 50%; }",
      ".a { grid-template-columns: 1fr 2fr; }",
    ])
      expect(rules(css, `${line}\n`), line).not.toContain("literal");
    expect(
      rules("shared/styles/tokens.css", ":root { --space-3: 0.75rem; --black-40: rgba(0, 0, 0, 0.4); }\n"),
    ).not.toContain("literal");
    expect(rules("shared/styles/global.css", ":focus-visible { outline: 2px solid var(--accent); }\n")).toContain(
      "literal",
    );
  });

  it("takes a component's stories as its states, like a test: named after it, beside it, no test of their own", () => {
    const stories = "shared/components/face/face.component.stories.tsx";
    const text =
      'import type { Meta } from "@storybook/react-vite";\nconst meta = { title: "Face" } satisfies Meta;\nexport default meta;\n';
    expect(rules(stories, text, ["shared/components/face/face.component.tsx"])).toEqual([]);
    expect(rules(stories, text)).toContain("orphanTest");
    expect(rules("shared/components/face/Face.stories.tsx", text, ["shared/components/face/Face.tsx"])).toContain(
      "naming",
    );
  });

  it("names a component in the new structure with no stories, but not a route or the old folders", () => {
    const face = "shared/components/face/face.component.tsx";
    const test = "shared/components/face/face.component.test.tsx";
    expect(rules(face, "", [test])).toContain("noStories");
    expect(rules(face, "", [test, "shared/components/face/face.component.stories.tsx"])).not.toContain("noStories");
    expect(
      rules("features/room/components/stage/stage-facecam/stage-facecam.component.tsx", "", [
        "features/room/components/stage/stage-facecam/stage-facecam.component.test.tsx",
      ]),
    ).toContain("noStories");
    const facecam = "features/room/components/stage/stage-facecam/stage-facecam";
    expect(rules(`${facecam}.component.tsx`, "", [`${facecam}.component.stories.tsx`])).not.toContain("noStories");
    expect(rules(`${facecam}.component.stories.tsx`, "", [`${facecam}.component.tsx`])).not.toContain("storiesPlace");
    expect(rules("shared/components/area/face/face.component.tsx", "", [])).not.toContain("noStories");
    expect(rules("routes/root/root.component.tsx", "", ["routes/root/root.component.test.tsx"])).not.toContain(
      "noStories",
    );
    expect(rules("components/ui/Button.tsx", "", ["components/ui/Button.test.tsx"])).not.toContain("noStories");
    const page = "features/home/components/home-page/home.page.tsx";
    expect(rules(page, "", ["features/home/components/home-page/home.page.test.tsx"])).toContain("noStories");
  });

  it("keeps stories to the components that have them, not the routes", () => {
    const story = 'import type { Meta } from "@storybook/react-vite";\nexport default {} satisfies Meta;\n';
    expect(rules("routes/root/root.component.stories.tsx", story, ["routes/root/root.component.tsx"])).toContain(
      "storiesPlace",
    );
    expect(
      rules("shared/components/face/face.component.stories.tsx", story, ["shared/components/face/face.component.tsx"]),
    ).not.toContain("storiesPlace");
  });

  it("names a test that waits in real time, or shares data at file level", () => {
    expect(
      rules("shared/utils/c.util.test.ts", "await new Promise((r) => setTimeout(r, 500));\n", [
        "shared/utils/c.util.ts",
      ]),
    ).toContain("realWait");
    expect(
      rules("shared/utils/d.util.test.ts", 'const BRUNO = aSharer({ name: "Bruno" });\n', ["shared/utils/d.util.ts"]),
    ).toContain("sharedData");
  });

  it("lets a test read a stylesheet", () => {
    const rulesBesideCode = (text: string) => rules("shared/utils/f.util.test.ts", text, ["shared/utils/f.util.ts"]);
    expect(rulesBesideCode('import css from "./f.module.css?raw";\n')).toEqual([]);
  });

  it("names a comment that switches a check off, and a line past Prettier's width, outside tests", () => {
    const code = (text: string) => rules("shared/utils/e.util.ts", text, ["shared/utils/e.util.test.ts"]);
    for (const off of ["// oxlint-disable-next-line", "// @ts-ignore", "// @ts-expect-error", "/* eslint-disable */"])
      expect(code(off + "\n")).toContain("disable");
    expect(code(`const s = "${"x".repeat(120)}";\n`)).toContain("lineLength");
    expect(rules("shared/utils/e.util.test.ts", "// @ts-ignore\n", ["shared/utils/e.util.ts"])).not.toContain(
      "disable",
    );
  });

  it("names a utils, constants, types or enum file outside its kind's folder", () => {
    const pairOf = (f: string) => [f.replace(/\.ts$/, ".test.ts")];
    expect(
      rules("services/livekit-service/capture.util.ts", "x\n", pairOf("services/livekit-service/capture.util.ts")),
    ).toEqual(["partPlace"]);
    expect(rules("features/room/state/room.types.ts")).toEqual(["partPlace"]);
    expect(rules("services/xove-api-service/api.constants.ts")).toEqual(["partPlace"]);
    expect(rules("shared/hooks/mode.enum.ts")).toEqual(["partPlace"]);
    expect(
      rules("services/livekit-service/utils/capture.util.ts", "x\n", [
        "services/livekit-service/utils/capture.util.test.ts",
      ]),
    ).toEqual([]);
    expect(rules("features/room/types/room.types.ts")).toEqual([]);
  });

  it("names a type, a named constant or a helper inside working code, exported or not", () => {
    const hook = (text: string) =>
      rules("features/room/hooks/use-x.hook.ts", text, ["features/room/hooks/use-x.hook.test.ts"]);
    expect(hook("type Inputs = { a: number };\n")).toEqual(["partInCode"]);
    expect(hook("export interface Shape { a: number }\n")).toEqual(["partInCode"]);
    expect(hook("enum Mode { A }\n")).toEqual(["partInCode"]);
    expect(hook("const LIMIT = 3;\n")).toEqual(["partInCode"]);
    expect(hook("function twice(n: number) {\n  return n * 2;\n}\n")).toEqual(["partInCode"]);
    expect(hook("const twice = (n: number) => n * 2;\n")).toEqual(["partInCode"]);
    expect(hook("export function useX({ a }: { a: number }) {\n  return a;\n}\n")).toEqual(["partInCode"]);
    expect(hook("export const useY = (p: { a: number }) => p.a;\n")).toEqual(["partInCode"]);
  });

  it("leaves working code alone: the file's job, class members, values and the parts' own files", () => {
    const store = (text: string) =>
      rules("features/room/state/room.store.ts", text, ["features/room/state/room.store.test.ts"]);
    expect(store("export class RoomStore {\n  private readonly ms = 3;\n  private poll(a: number) {}\n}\n")).toEqual(
      [],
    );
    expect(
      store("export function withSeat(model: RoomModel, seat: SeatState): RoomModel {\n  return model;\n}\n"),
    ).toEqual([]);
    expect(store('export const initialRoom = (): RoomModel => ({\n  mine: { screen: "off" },\n});\n')).toEqual([]);
    expect(store("export const api = new ApiClient();\n")).toEqual([]);
    expect(
      rules("features/room/utils/a.util.ts", "type T = { a: number };\nconst LIMIT = 3;\n", [
        "features/room/utils/a.util.test.ts",
      ]),
    ).toEqual([]);
  });

  it("names the longer ways to write a part inside working code", () => {
    const hook = (text: string) =>
      rules("features/room/hooks/use-x.hook.ts", text, ["features/room/hooks/use-x.hook.test.ts"]);
    expect(hook("export function useX({\n  a,\n}: {\n  a: number;\n}) {\n  return a;\n}\n")).toEqual(["partInCode"]);
    expect(hook("export function useX(p: {\n  a: number;\n}) {\n  return p.a;\n}\n")).toEqual(["partInCode"]);
    expect(hook("const helper = (\n  a: number,\n) => a;\n")).toEqual(["partInCode"]);
    expect(hook("const pick = <T,>(a: T) => a;\n")).toEqual(["partInCode"]);
    expect(hook("const defaults = { a: 1 };\n")).toEqual(["partInCode"]);
    expect(hook("const A = 1;\n")).toEqual(["partInCode"]);
    expect(hook("export function useX() {\n  type Local = number;\n  return 1;\n}\n")).toEqual(["partInCode"]);
    expect(hook("export function useX() {\n  return useState<{ a: number }>({ a: 1 });\n}\n")).toEqual(["partInCode"]);
    expect(hook("export function useX(v: unknown) {\n  return v as { a: number };\n}\n")).toEqual(["partInCode"]);
    expect(hook("class Helper {}\n")).toEqual(["partInCode"]);
    expect(
      rules("services/xove-api-service/api.service.ts", "class Api {}\nexport const api = new Api();\n", [
        "services/xove-api-service/api.service.test.ts",
      ]),
    ).toEqual([]);
    expect(hook("let count = 0;\n")).toEqual(["partInCode"]);
    expect(hook("const AuthContext = createContext(null);\n")).toEqual([]);
  });

  it("names a working file in a parts folder", () => {
    expect(
      rules("services/xove-api-service/utils/x.service.ts", "x\n", [
        "services/xove-api-service/utils/x.service.test.ts",
      ]),
    ).toEqual(["partPlace"]);
  });

  describe("history in the tooling (e2e/, scripts/, .storybook/)", () => {
    const lines = (text: string) => historyInTooling("e2e/support/a.ts", text).map((f) => f.line);

    it("names a number in a comment or a test's title", () => {
      expect(lines("// the time is named once (ADR-0102)\n")).toEqual([1]);
      expect(lines("const a = 1; // it's from spec 0123\n")).toEqual([1]);
      expect(lines("const b = 'x'; // don't: ADR-0042\n")).toEqual([1]);
      expect(lines("const a = 1; /* as in spec 0123 */\n")).toEqual([1]);
      expect(lines('it("keeps the layout (ADR-0086)", () => {});\n')).toEqual([1]);
      expect(lines('describe("the queue (#192)", () => {});\n')).toEqual([1]);
      expect(lines("test.skip(`the stage, design decision 3`, () => {});\n")).toEqual([1]);
    });

    it("leaves a number in a test's data, even one that looks like a comment", () => {
      expect(lines('const owner = "#190";\n')).toEqual([]);
      expect(lines('rules("a.ts", "// as decided in spec 0123\\n");\n')).toEqual([]);
      expect(lines('expect(new RegExp(p).test("shows one (spec 0133)")).toBe(true);\n')).toEqual([]);
      expect(lines("// the time is named once, here\n")).toEqual([]);
    });
  });
});
