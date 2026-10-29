import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { aSharer } from "../../testing/factories/sharer.factory";
import type { Sharer } from "@features/room/types/room-view.types";
import { currentToast } from "../ui/toast";
import { HearToggles, type Hearing } from "./HearToggles";

const bruno = (extra: Partial<Sharer> = {}) => aSharer({ hasSound: true, hasVoice: true, ...extra });
const HEARD: Hearing = { sound: { volume: 1, muted: false }, voice: { volume: 0.7, muted: false } };

describe("a preview's two toggles (spec 0123)", () => {
  it("mutes that person's sound or voice for me, each on its own, keeping its volume", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<HearToggles sharer={bruno()} hearing={HEARD} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...HEARD, voice: { volume: 0.7, muted: true } });
    await user.click(screen.getByRole("button", { name: "Mute Bruno's screen sound" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...HEARD, sound: { volume: 1, muted: true } });
  });

  it("shows what I muted as pressed", () => {
    render(
      <HearToggles sharer={bruno()} hearing={{ ...HEARD, voice: { volume: 0.7, muted: true } }} onChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Unmute Bruno's voice" })).toHaveAttribute("aria-pressed", "true");
  });

  it("greys a sound that isn't there in its place, and a touch says why", async () => {
    const onChange = vi.fn();
    render(<HearToggles sharer={bruno({ hasSound: false, hasVoice: false })} hearing={HEARD} onChange={onChange} />);
    const voice = screen.getByRole("button", { name: "Bruno: Bruno's mic is off" });
    expect(voice).toHaveAttribute("aria-disabled", "true");
    await userEvent.setup().click(voice);
    expect(onChange).not.toHaveBeenCalled();
    expect(currentToast()?.text).toBe("Bruno's mic is off");
  });

  it("lights the voice while they speak, never once I've muted it (who's talking)", () => {
    const { rerender } = render(<HearToggles sharer={bruno({ speaking: true })} hearing={HEARD} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Mute Bruno's voice" })).toHaveAttribute("data-talking");
    rerender(
      <HearToggles
        sharer={bruno({ speaking: true })}
        hearing={{ ...HEARD, voice: { volume: 0.7, muted: true } }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Unmute Bruno's voice" })).not.toHaveAttribute("data-talking");
    rerender(<HearToggles sharer={bruno({ speaking: false })} hearing={HEARD} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Mute Bruno's voice" })).not.toHaveAttribute("data-talking");
  });
});
