import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import type { Sharer } from "../../types/room-view.types";
import { StagePlayer } from "./stage-player.component";

function renderPlayer(sharers: Sharer[]) {
  const stage = renderHook(() => useStage(sharers)).result.current;
  const hearing = renderHook(() => useHearing(sharers, stage.big?.person.id ?? null)).result.current;
  render(
    <StagePlayer
      sharers={sharers}
      controls={aStreamControls()}
      stage={stage}
      hearing={hearing}
      ambilight={{ on: true, brightness: 0.9 }}
      shape={16 / 9}
      video={null}
      onVideo={vi.fn()}
      settingsPanel={<dialog open aria-label="Settings" />}
    />,
  );
}

describe("the player", () => {
  it("holds the view, fullscreen, the controls and the settings panel", () => {
    renderPlayer([]);
    expect(screen.getByRole("heading", { name: "Go live" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("plays the big stream with what I hear from them", () => {
    renderPlayer([aSharer({ hasSound: true })]);
    expect(screen.getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute the screen's sound" })).toBeInTheDocument();
  });
});
