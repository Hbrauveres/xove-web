import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RowShape } from "../types/row-fold.types";
import { useRowFold } from "./use-row-fold.hook";

const watching: RowShape = { mine: false, settingsOnly: false, sound: true, voice: true, live: false };

describe("how the controls fit the picture", () => {
  it("folds nothing while the picture's width is unknown", () => {
    expect(renderHook(() => useRowFold(null, null, watching)).result.current.folded).toEqual([]);
  });

  it("folds by the picture's width, with Go live as wide as it's shown", () => {
    // Sound, voice, a 150 px Go live and fullscreen need 302 px: it folds on a 260 px picture.
    const hook = renderHook(({ width }) => useRowFold(width, 150, watching), { initialProps: { width: 400 } });
    expect(hook.result.current.folded).toEqual([]);
    hook.rerender({ width: 260 });
    expect(hook.result.current.folded).toEqual(["go-live"]);
  });

  it("gives my own row its size and place", () => {
    const own = { ...watching, mine: true };
    expect(renderHook(() => useRowFold(240, null, own)).result.current).toEqual({
      folded: [],
      size: "m",
      beside: true,
    });
  });
});
