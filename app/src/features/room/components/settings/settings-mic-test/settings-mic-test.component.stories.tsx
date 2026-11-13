import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsMicTest } from "./settings-mic-test.component";

/** A track that plays nothing. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };

const meta = {
  title: "Room/Settings mic test",
  component: SettingsMicTest,
  args: { level: 0.08, sensitivity: 0.12, onSensitivity: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--settings-width)", padding: "var(--space-3-5)", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsMicTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/** My voice off: nothing to test, Test greyed. */
export const VoiceOff: Story = {};
/** My voice on, speaking over the line: sent, green. */
export const Speaking: Story = { args: { level: 0.45, track: silence } };
/** My voice on, quiet under the line: faint. */
export const Quiet: Story = { args: { level: 0.06, track: silence } };
