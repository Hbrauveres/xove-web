import { describe, expect, it } from "vitest";
import { analyse, type Rule } from "./check-code.ts";

/** The rules one file breaks: its path relative to src, its text, and which other files exist. */
const rules = (path: string, text = "", others: string[] = []) =>
  analyse(path, text, (p) => others.includes(p)).map((f): Rule => f.rule);

describe("the code check", () => {
  it("finds nothing in a file that follows the rules", () => {
    expect(
      rules("shared/utils/clamp.util.ts", "export const clamp = (x: number) => x;\n", [
        "shared/tests/utils/clamp.util.test.ts",
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

  it("names a file over 300 lines", () => {
    expect(rules("shared/utils/long.util.ts", "x\n".repeat(301), ["shared/tests/utils/long.util.test.ts"])).toContain(
      "size",
    );
  });

  it("names history in a comment, LiveKit outside core, and a literal colour in CSS", () => {
    expect(
      rules("features/room/utils/a.util.ts", "// as decided in spec 0123\n", [
        "features/room/tests/utils/a.util.test.ts",
      ]),
    ).toContain("history");
    expect(
      rules("features/room/utils/b.util.ts", 'import { Room } from "livekit-client";\n', [
        "features/room/tests/utils/b.util.test.ts",
      ]),
    ).toContain("livekit");
    expect(rules("shared/ui/face/face.component.module.css", ".face { color: #ffffff; }\n")).toContain("literal");
  });

  it("names a test that waits in real time, or shares data at file level", () => {
    expect(
      rules("shared/tests/utils/c.util.test.ts", "await new Promise((r) => setTimeout(r, 500));\n", [
        "shared/utils/c.util.ts",
      ]),
    ).toContain("realWait");
    expect(
      rules("shared/tests/utils/d.util.test.ts", 'const BRUNO = aSharer({ name: "Bruno" });\n', [
        "shared/utils/d.util.ts",
      ]),
    ).toContain("sharedData");
  });

  it("names a comment that switches a check off, and a line past Prettier's width, outside tests", () => {
    const code = (text: string) => rules("shared/utils/e.util.ts", text, ["shared/tests/utils/e.util.test.ts"]);
    for (const off of ["// oxlint-disable-next-line", "// @ts-ignore", "// @ts-expect-error", "/* eslint-disable */"])
      expect(code(off + "\n")).toContain("disable");
    expect(code(`const s = "${"x".repeat(120)}";\n`)).toContain("lineLength");
    expect(rules("shared/tests/utils/e.util.test.ts", "// @ts-ignore\n", ["shared/utils/e.util.ts"])).not.toContain(
      "disable",
    );
  });

  it("finds each module's tests in its own tests/ folder, at the same path as the file", () => {
    expect(rules("core/livekit/send.service.ts", "x\n", ["core/livekit/tests/send.service.test.ts"])).toEqual([]);
    expect(rules("features/room/hooks/use-x.hook.ts", "x\n", ["features/room/tests/hooks/use-x.hook.test.ts"])).toEqual(
      [],
    );
    expect(rules("app/app.component.tsx", "x\n", ["app/tests/app.component.test.tsx"])).toEqual([]);
    expect(rules("features/room/tests/hooks/use-x.hook.test.ts", "", ["features/room/hooks/use-x.hook.ts"])).toEqual(
      [],
    );
  });

  it("names a test beside its file in the new structure, and the file then has no test where it belongs", () => {
    expect(rules("core/api/api-client.service.test.ts", "", ["core/api/api-client.service.ts"])).toEqual(["testPlace"]);
    expect(rules("core/api/api-client.service.ts", "x\n", ["core/api/api-client.service.test.ts"])).toEqual(["noTest"]);
  });

  it("names a test in tests/ whose file isn't at the same path", () => {
    expect(rules("shared/tests/utils/gone.util.test.ts", "", ["shared/utils/other.util.ts"])).toEqual(["orphanTest"]);
  });

  it("keeps the old folders' tests beside their file until their step moves them", () => {
    expect(rules("components/stage/Stage.test.tsx", "", ["components/stage/Stage.tsx"])).toEqual([
      "structure",
      "naming",
    ]);
  });

  it("names a utils, constants, types or enum file outside its kind's folder", () => {
    const test = (f: string) => [
      f.replace(/^(core\/\w+|features\/\w+|shared|app)\//, "$1/tests/").replace(/\.ts$/, ".test.ts"),
    ];
    expect(rules("core/livekit/capture.util.ts", "x\n", test("core/livekit/capture.util.ts"))).toEqual(["partPlace"]);
    expect(rules("features/room/state/room.types.ts")).toEqual(["partPlace"]);
    expect(rules("core/api/api.constants.ts")).toEqual(["partPlace"]);
    expect(rules("shared/hooks/mode.enum.ts")).toEqual(["partPlace"]);
    expect(
      rules("core/livekit/utils/capture.util.ts", "x\n", ["core/livekit/tests/utils/capture.util.test.ts"]),
    ).toEqual([]);
    expect(rules("features/room/types/room.types.ts")).toEqual([]);
  });

  it("names a type, a named constant or a helper inside working code, exported or not", () => {
    const hook = (text: string) =>
      rules("features/room/hooks/use-x.hook.ts", text, ["features/room/tests/hooks/use-x.hook.test.ts"]);
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
      rules("features/room/state/room.store.ts", text, ["features/room/tests/state/room.store.test.ts"]);
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
        "features/room/tests/utils/a.util.test.ts",
      ]),
    ).toEqual([]);
  });

  it("names the longer ways to write a part inside working code", () => {
    const hook = (text: string) =>
      rules("features/room/hooks/use-x.hook.ts", text, ["features/room/tests/hooks/use-x.hook.test.ts"]);
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
      rules("core/api/api.service.ts", "class Api {}\nexport const api = new Api();\n", [
        "core/api/tests/api.service.test.ts",
      ]),
    ).toEqual([]);
    expect(hook("let count = 0;\n")).toEqual(["partInCode"]);
    expect(hook("const AuthContext = createContext(null);\n")).toEqual([]);
  });

  it("names a working file in a parts folder, and a parts folder that isn't right under its module", () => {
    expect(rules("core/api/utils/x.service.ts", "x\n", ["core/api/tests/utils/x.service.test.ts"])).toEqual([
      "partPlace",
    ]);
    expect(
      rules("features/room/hooks/utils/a.util.ts", "x\n", ["features/room/tests/hooks/utils/a.util.test.ts"]),
    ).toEqual(["partPlace"]);
    expect(rules("shared/tests/tests/utils/a.util.test.ts", "", ["shared/tests/utils/a.util.ts"])).toContain(
      "testPlace",
    );
  });
});
