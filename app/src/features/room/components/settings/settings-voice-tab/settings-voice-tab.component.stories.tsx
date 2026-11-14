import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEFAULT_VOICE } from "@services/preferences-service";
import { SettingsVoiceTab } from "./settings-voice-tab.component";

const meta = {
  title: "Room/Settings voice tab",
  component: SettingsVoiceTab,
  args: {
    shown: true,
    prefs: DEFAULT_VOICE,
    onPrefs: () => undefined,
    mics: [
      { deviceId: "mic-1", label: "Headset (USB)" },
      { deviceId: "mic-2", label: "MacBook Pro microphone" },
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3-5)",
          width: "var(--settings-width)",
          padding: "var(--space-3-5)",
          background: "var(--panel)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsVoiceTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** My voice off: Test greyed. */
export const VoiceOff: Story = {};
/** No microphones listed yet. */
export const NoMics: Story = { args: { mics: [] } };
