import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DEFAULT_VOICE } from "@services/preferences-service";
import type { SettingsSession, SettingsTab } from "../../../types/settings.types";
import { SettingsTabs } from "./settings-tabs.component";

const noop = () => undefined;
const SETTINGS: SettingsSession = {
  open: true,
  onClose: noop,
  screenTab: true,
  mine: { screen: true, camera: false },
  prefs: { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "smooth" } },
  onPrefsChange: noop,
  screenSurface: "window",
  onChangeWindow: noop,
  cameras: [{ deviceId: "cam-1", label: "Logitech C920" }],
  cameraId: "cam-1",
  onPickCamera: noop,
  onPreviewCamera: noop,
  voicePrefs: DEFAULT_VOICE,
  onVoicePrefs: noop,
  mics: [{ deviceId: "mic-1", label: "Headset (USB)" }],
};

/** The tabs in the panel's column, their choice kept here. */
function Example({ first }: { first: SettingsTab }) {
  const [chosen, setChosen] = useState<SettingsTab>(first);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "var(--settings-width)",
        height: "var(--settings-min-height)",
        background: "var(--panel)",
        color: "var(--text)",
      }}
    >
      <SettingsTabs
        settings={SETTINGS}
        usable={["screen", "camera", "voice"]}
        chosen={chosen}
        onChoose={setChosen}
        cue={null}
      />
    </div>
  );
}

const meta = {
  title: "Room/Settings tabs",
  component: Example,
  args: { first: "screen" },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On Screen, my screen shared. */
export const Screen: Story = {};
/** On Camera. */
export const Camera: Story = { args: { first: "camera" } };
/** On Voice. */
export const Voice: Story = { args: { first: "voice" } };
