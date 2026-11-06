import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StreamControls } from "../../../../components/stage/PlayerButtons";
import { aSharer } from "../../../../testing/factories/sharer.factory";
import { aStreamControls } from "../../../../testing/factories/stream-controls.factory";
import { useStage } from "../../hooks/use-stage.hook";
import type { Sharer } from "../../types/room-view.types";
import { Stage } from "./stage.component";

/** The stage as the room shows it: its pick kept by the room's own hook. */
function Room({ sharers, controls = aStreamControls() }: { sharers: Sharer[]; controls?: StreamControls }) {
  const stage = useStage(sharers);
  return (
    <Stage
      sharers={sharers}
      controls={controls}
      stage={stage}
      ambilight={{ on: true, brightness: 0.9 }}
      settingsPanel={<dialog open aria-label="Settings" />}
    />
  );
}

const stage = () => screen.getByRole("region", { name: "Shared screen" });

describe("the stage", () => {
  it("stands by with nobody live, with the settings in its corner and fullscreen", () => {
    render(<Room sharers={[]} />);
    expect(within(stage()).getByRole("heading", { name: "Go live" })).toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("plays the person sharing longest, with what I hear from them", () => {
    render(<Room sharers={[aSharer({ hasSound: true })]} />);
    expect(within(stage()).getByLabelText("Bruno's shared screen")).toBeInTheDocument();
    expect(within(stage()).getByRole("button", { name: "Mute the screen's sound" })).toBeInTheDocument();
  });

  it("holds the settings panel inside the player, so it comes along in fullscreen", () => {
    render(<Room sharers={[]} />);
    expect(within(stage()).getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
  });

  it("takes the picture's shape: 16:9 while empty", () => {
    render(<Room sharers={[]} />);
    expect((stage().firstElementChild as HTMLElement).style.getPropertyValue("--shape")).toBe(String(16 / 9));
  });
});
