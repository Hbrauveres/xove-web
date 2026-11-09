import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StageMyMic } from "./stage-my-mic.component";

describe("my mic", () => {
  it("says what a click does, and is pressed while it's on", async () => {
    const onClick = vi.fn();
    render(<StageMyMic on size="m" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Mute your voice", pressed: true }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("wears the talking cue while my voice is sent, and only while it's on", () => {
    const { rerender } = render(<StageMyMic on speaking size="l" />);
    expect(screen.getByRole("button", { name: "Mute your voice" })).toHaveAttribute("data-cue", "talking");
    rerender(<StageMyMic on speaking={false} size="l" />);
    expect(screen.getByRole("button", { name: "Mute your voice" })).not.toHaveAttribute("data-cue");
    rerender(<StageMyMic on={false} speaking size="l" />);
    expect(screen.getByRole("button", { name: "Share your voice" })).not.toHaveAttribute("data-cue");
  });
});
