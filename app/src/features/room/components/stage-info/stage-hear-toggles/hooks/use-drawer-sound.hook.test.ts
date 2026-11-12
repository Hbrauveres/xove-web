import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SoundKind } from "../../../../types/sound.types";
import { useDrawerSound } from "./use-drawer-sound.hook";

const render = () =>
  renderHook(({ open }: { open: SoundKind | null }) => useDrawerSound(open), {
    initialProps: { open: null as SoundKind | null },
  });

describe("useDrawerSound", () => {
  it("shows the open sound, and keeps it while the row rolls up", () => {
    const { result, rerender } = render();
    rerender({ open: "voice" });
    expect(result.current).toMatchObject({ shown: "voice", leaving: null, entering: false });
    rerender({ open: null });
    expect(result.current.shown).toBe("voice");
  });

  it("switching, lets the old one leave and the new one enter, until each is done", () => {
    const { result, rerender } = render();
    rerender({ open: "voice" });
    rerender({ open: "sound" });
    expect(result.current).toMatchObject({ shown: "sound", leaving: "voice", entering: true });
    act(() => result.current.left());
    act(() => result.current.entered());
    expect(result.current).toMatchObject({ shown: "sound", leaving: null, entering: false });
  });
});
