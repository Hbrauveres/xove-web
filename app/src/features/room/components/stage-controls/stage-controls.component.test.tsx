import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import type { StageControlsProps } from "./types/stage-controls.types";
import { StageControls } from "./stage-controls.component";

const hear = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };

function renderControls(over: Partial<StageControlsProps> = {}) {
  render(
    <StageControls
      big={null}
      controls={aStreamControls()}
      hearing={{ hearOf: () => hear, setHear: vi.fn() } as never}
      onStart={vi.fn()}
      onSettings={vi.fn()}
      onMenuChange={vi.fn()}
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
});
