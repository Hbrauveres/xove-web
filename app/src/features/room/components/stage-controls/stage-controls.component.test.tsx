import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import { useHearing } from "../../hooks/use-hearing.hook";
import type { StageControlsProps } from "./types/stage-controls.types";
import { StageControls } from "./stage-controls.component";

function renderControls(over: Partial<StageControlsProps> = {}) {
  const big = over.big ?? null;
  const hearing = renderHook(() => useHearing(big ? [big] : [], big?.person.id ?? null)).result.current;
  render(
    <StageControls
      big={null}
      controls={aStreamControls()}
      hearing={hearing}
      onStart={vi.fn()}
      onSettings={vi.fn()}
      onMenuChange={vi.fn()}
      anchor={null}
      {...over}
    />,
  );
}

describe("the stage's bar of controls", () => {
  it("has only the settings with nobody live", () => {
    renderControls();
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(["Settings"]);
  });

  it("over someone else's stream: the screen's sound I hear, and Go live", () => {
    renderControls({ big: aSharer({ hasSound: true }) });
    expect(screen.getByRole("button", { name: "Mute the screen's sound" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go live" })).toBeInTheDocument();
  });

  it("over my own stream: my buttons, with my mic", () => {
    renderControls({
      big: { ...aSharer(), isMe: true },
      controls: aStreamControls({ mine: { screen: true, camera: false } }),
    });
    expect(screen.getByRole("button", { name: "Share your voice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("over my own stream, my mic wears the talking cue while my voice is sent", () => {
    renderControls({
      big: { ...aSharer(), isMe: true },
      controls: aStreamControls({ mine: { screen: true, camera: false }, voice: true, speaking: true }),
    });
    expect(screen.getByRole("button", { name: "Mute your voice" })).toHaveAttribute("data-cue", "talking");
  });

  it("over someone else's stream, my mic hands my speaking on", () => {
    renderControls({
      big: aSharer(),
      controls: aStreamControls({ mine: { screen: true, camera: false }, voice: true, speaking: true }),
    });
    expect(screen.getByRole("button", { name: "Mute your voice" })).toHaveAttribute("data-cue", "talking");
  });
});
