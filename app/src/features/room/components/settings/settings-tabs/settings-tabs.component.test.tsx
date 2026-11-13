import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE } from "@services/preferences-service";
import type { SettingsSession, SettingsTab } from "../../../types/settings.types";
import { SettingsTabs } from "./settings-tabs.component";

function Holder({
  settings,
  usable = ["screen", "camera", "voice"],
}: {
  settings: SettingsSession;
  usable?: SettingsTab[];
}) {
  const [chosen, setChosen] = useState<SettingsTab>(usable[0] ?? "camera");
  return <SettingsTabs settings={settings} usable={usable} chosen={chosen} onChoose={setChosen} cue={null} />;
}

const session = (over: Partial<SettingsSession> = {}): SettingsSession => ({
  open: true,
  onClose: () => {},
  screenTab: true,
  mine: { screen: false, camera: false },
  prefs: { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "smooth" } },
  onPrefsChange: vi.fn(),
  onChangeWindow: () => {},
  cameras: [],
  cameraId: null,
  onPickCamera: () => {},
  onPreviewCamera: () => {},
  ...over,
});
const tab = (name: string) => screen.getByRole("tab", { name });

describe("the settings' tabs", () => {
  it("are Screen, Camera and Voice, marking what I send", () => {
    render(<Holder settings={session({ mine: { screen: false, camera: true }, voice: true })} />);
    const dot = (name: string) => Boolean(tab(name).querySelector("[data-live]"));
    expect([dot("Screen"), dot("Camera"), dot("Voice")]).toEqual([false, true, true]);
  });

  it("grey Screen where a screen can't be shared", () => {
    render(<Holder settings={session({ screenTab: false })} usable={["camera", "voice"]} />);
    expect(tab("Screen")).toHaveAttribute("aria-disabled", "true");
    expect(tab("Camera")).toHaveAttribute("aria-selected", "true");
  });

  it("hand each tab its own values: the quality to its stream, the voice's to the voice", async () => {
    const onVoicePrefs = vi.fn();
    const s = session({ voicePrefs: DEFAULT_VOICE, onVoicePrefs, mics: [] });
    render(<Holder settings={s} />);
    await userEvent.click(tab("Camera"));
    const camera = within(screen.getByRole("tabpanel", { name: "Camera" }));
    await userEvent.click(camera.getByRole("radio", { name: "480p" }));
    expect(s.onPrefsChange).toHaveBeenLastCalledWith("camera", { quality: "480p", mode: "smooth" });
    await userEvent.click(tab("Voice"));
    await userEvent.click(screen.getByRole("switch", { name: "Noise suppression" }));
    expect(onVoicePrefs).toHaveBeenLastCalledWith({ ...DEFAULT_VOICE, noiseSuppression: false });
  });
});
