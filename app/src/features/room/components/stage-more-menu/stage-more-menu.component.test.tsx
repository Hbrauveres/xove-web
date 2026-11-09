import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsAnchorContext } from "../../hooks/use-settings-anchor.hook";
import type { FoldKey } from "../../types/fold-key.types";
import { StageMoreMenu } from "./stage-more-menu.component";
import userEvent from "@testing-library/user-event";
const heard = (over = {}) => ({ volume: 0.6, muted: false, onChange: vi.fn(), ...over });

function more(folded: FoldKey[], over = {}) {
  const props = {
    folded,
    canShareScreen: true,
    onStart: vi.fn(),
    onSettings: vi.fn(),
    sound: heard(),
    voice: { ...heard(), name: "Bruno" },
    ...over,
  };
  const cog = vi.fn();
  render(
    <SettingsAnchorContext value={{ cog, row: vi.fn() }}>
      <StageMoreMenu {...props} />
    </SettingsAnchorContext>,
  );
  return { ...props, cog };
}
const open = () => userEvent.click(screen.getByRole("button", { name: "More controls" }));

describe("'…'", () => {
  it("holds Go live's rows when Go live folded, and starts what's picked, closing", async () => {
    const p = more(["go-live"]);
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Turn on your camera" }));
    expect(p.onStart).toHaveBeenCalledWith("camera");
    expect(screen.queryByRole("group", { name: "More controls" })).not.toBeInTheDocument();
  });

  it("holds the folded sounds, each with its own button and slider, working from there", async () => {
    const p = more(["go-live", "sound", "voice"]);
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Mute Bruno's voice" }));
    expect(p.voice.onChange).toHaveBeenCalledWith({ volume: 0.6, muted: true });
    fireEvent.change(screen.getByRole("slider", { name: "Screen sound volume" }), { target: { value: "0.2" } });
    expect(p.sound.onChange).toHaveBeenCalledWith({ volume: 0.2, muted: false });
  });

  it("holds only what folded: the sounds while I'm live, no Go live or settings", async () => {
    more(["sound", "voice"]);
    await open();
    expect(screen.getByRole("slider", { name: "Screen sound volume" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Bruno's voice volume" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("opens the settings from its own row with nobody live", async () => {
    const p = more(["settings"]);
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(p.onSettings).toHaveBeenCalled();
  });

  it("is where the settings open from once Go live or the settings folded into it", () => {
    const p = more(["go-live"]);
    expect(p.cog).toHaveBeenCalledWith(screen.getByRole("button", { name: "More controls" }));
  });

  it("isn't where the settings open from when only sounds folded", () => {
    const p = more(["sound", "voice"]);
    expect(p.cog).not.toHaveBeenCalled();
  });
});
