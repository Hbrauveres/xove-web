import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageViewerBar } from "./stage-viewer-bar.component";

const heard = { volume: 1, muted: false, onChange: () => undefined };

const meta = {
  title: "Room/Stage viewer bar",
  component: StageViewerBar,
  args: {
    sound: heard,
    voice: { ...heard, name: "Bruno" },
    live: false,
    canShareScreen: true,
    onStart: () => undefined,
    onSettings: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: "48rem", aspectRatio: "16 / 9", background: "var(--grey-22-90)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageViewerBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Watching Bruno: his sound and voice at the left, Go live at the right. */
export const Watching: Story = {};
/** I'm live too: my mic at the right. */
export const MeLive: Story = { args: { live: true, micOn: true, onMic: () => undefined } };
