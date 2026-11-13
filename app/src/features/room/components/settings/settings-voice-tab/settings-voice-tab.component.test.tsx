import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE } from "@services/preferences-service";
import { toastStore } from "@shared/stores/toast-store";
import { NO_ISOLATION } from "./constants/voice-switches.constants";
import { SettingsVoiceTab } from "./settings-voice-tab.component";

const MICS = [
  { deviceId: "mic-1", label: "Headset (USB)" },
  { deviceId: "mic-2", label: "MacBook Pro microphone" },
];
/** The browser's support for voice isolation. */
const isolation = (supported: boolean) =>
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: { getSupportedConstraints: () => (supported ? { voiceIsolation: true } : {}) },
  });

function setup(onPrefs = vi.fn()) {
  render(<SettingsVoiceTab shown prefs={DEFAULT_VOICE} onPrefs={onPrefs} mics={MICS} />);
  return onPrefs;
}

describe("the Voice tab", () => {
  it("has the microphone, its level and the four switches, each saying what it does", () => {
    isolation(true);
    setup();
    expect(screen.getByRole("button", { name: "Microphone: Headset (USB)" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Mic sensitivity" })).toHaveValue(String(DEFAULT_VOICE.sensitivity));
    const switches = screen.getAllByRole("switch");
    expect(switches.map((s) => [s.getAttribute("aria-label"), s.getAttribute("aria-checked")])).toEqual([
      ["Echo cancellation", "true"],
      ["Noise suppression", "true"],
      ["Automatic volume", "true"],
      ["Voice isolation", "false"],
    ]);
    expect(switches[1]!.closest("label")).toHaveAccessibleDescription("Quiets fans, keyboards and hum");
  });

  it("says where the microphones will be before the voice is on", () => {
    render(<SettingsVoiceTab shown prefs={DEFAULT_VOICE} onPrefs={() => {}} mics={[]} />);
    expect(screen.getByText("The browser lists your microphones once you turn your voice on.")).toBeInTheDocument();
  });

  it("applies a switch at once", async () => {
    isolation(true);
    const onPrefs = setup();
    await userEvent.click(screen.getByRole("switch", { name: "Noise suppression" }));
    expect(onPrefs).toHaveBeenLastCalledWith({ ...DEFAULT_VOICE, noiseSuppression: false });
  });

  it("greys voice isolation where the browser can't do it, saying why when touched", async () => {
    isolation(false);
    const onPrefs = setup();
    const switchOf = screen.getByRole("switch", { name: "Voice isolation" });
    expect(switchOf).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(switchOf);
    expect(onPrefs).not.toHaveBeenCalled();
    expect(toastStore.current()?.text).toBe(NO_ISOLATION);
  });
});
