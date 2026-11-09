import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toastStore } from "@shared/stores/toast-store";
import { StageSoundButton } from "./stage-sound-button.component";
import userEvent from "@testing-library/user-event";
const props = (over = {}) => ({
  kind: "voice" as const,
  muted: false,
  volume: 1,
  label: "Mute Ana's voice",
  tip: "Ana's voice",
  onToggle: vi.fn(),
  onKeyboardFocus: vi.fn(),
  ...over,
});

describe("a sound's button", () => {
  it("mutes on a click, saying whether it's muted", async () => {
    const p = props({ muted: true, label: "Unmute Ana's voice" });
    render(<StageSoundButton {...p} />);
    const button = screen.getByRole("button", { name: "Unmute Ana's voice", pressed: true });
    await userEvent.click(button);
    expect(p.onToggle).toHaveBeenCalledOnce();
  });

  it("where there's nothing to hear, is greyed and says why on a click", async () => {
    const show = vi.spyOn(toastStore, "show");
    const p = props({ unavailable: "Ana's mic is off", label: "Ana: Ana's mic is off" });
    render(<StageSoundButton {...p} />);
    const button = screen.getByRole("button", { name: "Ana: Ana's mic is off" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(button);
    expect(p.onToggle).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledWith("Ana's mic is off", expect.anything());
  });

  it("opens its slider when the keyboard brings the focus, not the mouse", async () => {
    const p = props();
    render(<StageSoundButton {...p} />);
    await userEvent.click(screen.getByRole("button"));
    expect(p.onKeyboardFocus).not.toHaveBeenCalled();
    (document.activeElement as HTMLElement).blur();
    await userEvent.tab();
    expect(p.onKeyboardFocus).toHaveBeenCalledOnce();
  });
});
