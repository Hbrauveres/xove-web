import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageUnmute } from "./stage-unmute.component";

describe("unmute, while the browser holds the room's sound", () => {
  it("is a button that says what a click does, its crossed speaker first", () => {
    render(<StageUnmute />);
    const button = screen.getByRole("button", { name: "Click to unmute" });
    expect(button.querySelector('[data-icon="volume-off"]')).not.toBeNull();
  });

  it("points at itself with the app's cue, and stays when the controls fade", () => {
    render(<StageUnmute />);
    const button = screen.getByRole("button", { name: "Click to unmute" });
    expect(button.querySelector("[data-cue]")).not.toBeNull();
    expect(button).toHaveAttribute("data-stays");
  });
});
