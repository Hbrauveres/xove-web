import { describe, expect, it } from "vitest";
import { analyse, type Rule } from "./check-code.ts";

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

  it("names a file over 300 lines", () => {
    expect(rules("shared/utils/long.util.ts", "x\n".repeat(301), ["shared/utils/long.util.test.ts"])).toContain("size");
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
});
