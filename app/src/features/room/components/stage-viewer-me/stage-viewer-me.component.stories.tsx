import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageViewerMe } from "./stage-viewer-me.component";

const meta = {
  title: "Room/Stage viewer me",
  component: StageViewerMe,
  args: { live: false, canShareScreen: true, onStart: () => undefined, onSettings: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageViewerMe>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Not live: Go live. */
export const GoLive: Story = {};
/** Live, my mic on: red. */
export const MicOn: Story = { args: { live: true, micOn: true } };
/** Nobody live: the settings alone. */
export const SettingsOnly: Story = { args: { settingsOnly: true } };
