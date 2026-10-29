import { describe, expect, it } from "vitest";
import { checkLayout } from "./check-layout.ts";

/** The layout rules a set of files breaks, as "rule file" lines; each file's text is its imports. */
const layout = (files: Record<string, string>) =>
  checkLayout(new Map(Object.entries(files))).map((f) => `${f.rule} ${f.file}`);

const unit = (dir: string, file: string, text = "") => ({ [`${dir}/index.ts`]: "", [`${dir}/${file}`]: text });

describe("the layout (ADR-0086)", () => {
  it("finds nothing in a layout that follows the rules", () => {
    expect(
      layout({
        ...unit(
          "features/room/components/stage-facecam",
          "stage-facecam.component.tsx",
          'import { a } from "./utils/drag.util";\nimport { useStage } from "../../hooks/use-stage.hook";\n',
        ),
        "features/room/components/stage-facecam/utils/drag.util.ts": "",
        "features/room/hooks/use-stage.hook.ts":
          'import { api } from "@services/xove-api-service";\nimport { Button } from "@shared/components/button";\n',
        "features/room/utils/x.util.ts": "",
        ...unit(
          "features/room/components/people-row",
          "people-row.component.tsx",
          'import { useStage } from "../../hooks/use-stage.hook";\nimport { x } from "../../utils/x.util";\n',
        ),
        "components/stage/Stage.tsx": 'import { x } from "@features/room/utils/x.util";\n',
        ...unit("shared/components/button", "button.component.tsx"),
        ...unit("services/xove-api-service", "xove-api.service.ts"),
      }),
    ).toEqual([]);
  });

  it("names a part used outside its owner's folder: it moves up", () => {
    expect(
      layout({
        ...unit("features/room/components/a", "a.component.tsx", 'import { x } from "./utils/x.util";\n'),
        "features/room/components/a/utils/x.util.ts": "",
        ...unit("features/room/components/b", "b.component.tsx", 'import { x } from "../a/utils/x.util";\n'),
      }),
    ).toEqual(["indexBypass features/room/components/b/b.component.tsx"]);
    expect(
      layout({
        "features/room/utils/x.util.ts": "",
        "features/admin/hooks/use-y.hook.ts": 'import { x } from "@features/room/utils/x.util";\n',
        "features/room/hooks/use-z.hook.ts": 'import { x } from "../utils/x.util";\n',
      }),
    ).toEqual(["importAcross features/admin/hooks/use-y.hook.ts", "partOwner features/room/utils/x.util.ts"]);
  });

  it("names a part used by a single unit below it: it moves down", () => {
    expect(
      layout({
        "features/room/utils/x.util.ts": "",
        ...unit("features/room/components/a", "a.component.tsx", 'import { x } from "../../utils/x.util";\n'),
      }),
    ).toEqual(["partTooHigh features/room/utils/x.util.ts"]);
    expect(
      layout({
        "shared/utils/y.util.ts": "",
        "features/room/hooks/use-a.hook.ts": 'import { y } from "@shared/utils/y.util";\n',
      }),
    ).toEqual(["partTooHigh shared/utils/y.util.ts"]);
  });

  it("keeps a part where the old folders still use it", () => {
    expect(
      layout({
        "features/room/utils/x.util.ts": "",
        ...unit("features/room/components/a", "a.component.tsx", 'import { x } from "../../utils/x.util";\n'),
        "pages/RoomPage.tsx": 'import { x } from "@features/room/utils/x.util";\n',
      }),
    ).toEqual([]);
  });

  it("names a unit inside a unit, a folder inside a part folder or inside a component, and a path too deep", () => {
    expect(
      layout({
        ...unit("features/room/components/a", "a.component.tsx"),
        ...unit("features/room/components/a/b", "b.component.tsx"),
        "features/room/hooks/utils/x.util.ts": "",
        "features/room/components/a/c/d.ts": "",
        "features/room/components/stage-x/hooks/deep/more/use-y.hook.ts": "",
      }),
    ).toEqual([
      "unitInUnit features/room/components/a/b/b.component.tsx",
      "nested features/room/components/a/b/b.component.tsx",
      "nested features/room/components/a/b/index.ts",
      "nested features/room/components/a/c/d.ts",
      "nested features/room/components/stage-x/hooks/deep/more/use-y.hook.ts",
      "tooDeep features/room/components/stage-x/hooks/deep/more/use-y.hook.ts",
      "nested features/room/hooks/utils/x.util.ts",
    ]);
  });

  it("names an import going up, across features, around a unit's index, or from the app into testing", () => {
    expect(
      layout({
        "services/a-service/a.service.ts": 'import { b } from "@features/room/utils/b.util";\n',
        "features/room/utils/b.util.ts": "",
        "shared/utils/c.util.ts": 'import { r } from "@routes/root";\n',
        ...unit("routes/root", "root.component.tsx"),
        "features/admin/hooks/use-d.hook.ts":
          'import { b } from "@features/room/utils/b.util";\nimport { f } from "@testing/fakeApi";\n',
        "testing/fakeApi.ts": "",
        "features/admin/hooks/use-d.hook.test.ts": 'import { f } from "@testing/fakeApi";\n',
        ...unit("services/e-service", "e.service.ts"),
        "services/e-service/utils/e.util.ts": "",
        "features/admin/hooks/use-g.hook.ts": 'import { e } from "@services/e-service/utils/e.util";\n',
      }).filter((l) => !l.startsWith("part")),
    ).toEqual([
      "importAcross features/admin/hooks/use-d.hook.ts",
      "importTesting features/admin/hooks/use-d.hook.ts",
      "indexBypass features/admin/hooks/use-g.hook.ts",
      "importUp services/a-service/a.service.ts",
      "importUp shared/utils/c.util.ts",
    ]);
  });
});
