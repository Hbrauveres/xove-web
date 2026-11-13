import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsScreenTab } from "./settings-screen-tab.component";

const meta = {
  title: "Room/Settings screen tab",
  component: SettingsScreenTab,
  args: {
    live: false,
    onChangeWindow: () => undefined,
    stream: { prefs: { quality: "1080p", mode: "smooth" }, onChange: () => undefined },
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
} satisfies Meta<typeof SettingsScreenTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Not sharing: what these are for. */
export const NotSharing: Story = {};
/** Sharing a window, with Change. */
export const Sharing: Story = { args: { live: true, surface: "window" } };
/** Sharing without sound: how to share it. */
export const NoSound: Story = { args: { live: true, surface: "monitor", noSound: true } };
