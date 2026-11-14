import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsQualityMode } from "./settings-quality-mode.component";

const meta = {
  title: "Room/Settings quality mode",
  component: SettingsQualityMode,
  args: { kind: "screen", prefs: { quality: "1080p", mode: "smooth" }, onChange: () => undefined },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
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
} satisfies Meta<typeof SettingsQualityMode>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A screen's. */
export const Screen: Story = {};
/** A camera's. */
export const Camera: Story = { args: { kind: "camera", prefs: { quality: "720p", mode: "sharp" } } };
/** A change under way: greyed. */
export const Busy: Story = { args: { busy: true } };
