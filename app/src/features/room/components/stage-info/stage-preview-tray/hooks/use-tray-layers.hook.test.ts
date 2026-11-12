import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OpenRow } from "../../../../types/preview-tray.types";
import { useTrayLayers } from "./use-tray-layers.hook";

const row = (id: string): OpenRow => {
  const anchor = document.createElement("li");
  return { id, anchor, picture: anchor };
};

describe("useTrayLayers", () => {
  it("unrolls the new row while the last one rolls back, until it's gone", () => {
    const bruno = row("user-2");
    const ana = row("user-3");
    const { result, rerender } = renderHook(({ open }) => useTrayLayers(open), {
      initialProps: { open: bruno as OpenRow | null },
    });
    rerender({ open: ana });
    expect(result.current.layers.map((l) => [l.open.id, l.leaving])).toEqual([
      ["user-2", true],
      ["user-3", false],
    ]);
    act(() => result.current.gone("user-2"));
    expect(result.current.layers.map((l) => l.open.id)).toEqual(["user-3"]);
  });

  it("unrolls a row again when the pointer comes back while it rolls back", () => {
    const bruno = row("user-2");
    const { result, rerender } = renderHook(({ open }) => useTrayLayers(open), {
      initialProps: { open: bruno as OpenRow | null },
    });
    rerender({ open: null });
    rerender({ open: bruno });
    expect(result.current.layers).toEqual([{ open: bruno, leaving: false }]);
  });
});
