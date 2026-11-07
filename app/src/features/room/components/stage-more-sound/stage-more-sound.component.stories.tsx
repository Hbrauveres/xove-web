import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageMoreSound } from "./stage-more-sound.component";

const meta = {
  title: "Room/Stage more sound",
  component: StageMoreSound,
  args: { kind: "sound", sound: { volume: 0.7, muted: false, onChange: () => undefined } },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
          width: "var(--viewer-menu-width)",
          padding: "var(--space-1-5)",
          background: "var(--panel)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageMoreSound>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The stream's sound, folded into "…": its button and its slider. */
export const Sound: Story = {};
/** The streamer's voice, muted: its icon crossed. */
export const VoiceMuted: Story = {
  args: { kind: "voice", sound: { volume: 0.45, muted: true, name: "Bruno", onChange: () => undefined } },
};
