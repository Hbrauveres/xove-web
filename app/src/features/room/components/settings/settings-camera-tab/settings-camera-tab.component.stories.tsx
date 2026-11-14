import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsCameraTab } from "./settings-camera-tab.component";

const meta = {
  title: "Room/Settings camera tab",
  component: SettingsCameraTab,
  args: {
    live: false,
    cameras: {
      list: [
        { deviceId: "cam-1", label: "Logitech C920" },
        { deviceId: "cam-2", label: "Integrated Webcam" },
      ],
      chosen: "cam-1",
      onPick: () => undefined,
    },
    stream: { prefs: { quality: "720p", mode: "smooth" }, onChange: () => undefined },
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
} satisfies Meta<typeof SettingsCameraTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** My camera off: only I see its preview. */
export const OnlyMine: Story = {};
/** My camera sent. */
export const Live: Story = { args: { live: true } };
/** The camera refused. */
export const Refused: Story = { args: { problem: "blocked" } };
