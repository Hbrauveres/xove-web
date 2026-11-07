import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { aStreamControls } from "@testing/factories/stream-controls.factory";
import { StageStreamButton } from "./stage-stream-button.component";

describe("one of my streams' buttons", () => {
  it("starts its stream, or stops it while it's live", async () => {
    const controls = aStreamControls();
    const { rerender } = render(<StageStreamButton kind="camera" {...controls} />);
    await userEvent.click(screen.getByRole("button", { name: "Turn on your camera" }));
    expect(controls.onStart).toHaveBeenCalledWith("camera");
    rerender(<StageStreamButton kind="camera" {...controls} mine={{ screen: false, camera: true }} />);
    await userEvent.click(screen.getByRole("button", { name: "Turn off your camera", pressed: true }));
    expect(controls.onStop).toHaveBeenCalledWith("camera");
  });

  it("can't start in a full room, saying why", async () => {
    const controls = aStreamControls({ free: 0, places: 4 });
    render(<StageStreamButton kind="screen" {...controls} />);
    const share = screen.getByRole("button", { name: "Share your screen" });
    expect(share).toHaveAccessibleDescription(/^4 streams are live/);
    await userEvent.click(share);
    expect(controls.onStart).not.toHaveBeenCalled();
  });
});
