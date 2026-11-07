import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageSoundButton } from "./stage-sound-button.component";

const meta = {
  title: "Room/Stage sound button",
  component: StageSoundButton,
  args: {
    kind: "voice",
    muted: false,
    volume: 1,
    label: "Mute Ana's voice",
    tip: "Ana's voice",
    onToggle: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageSoundButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Their voice while they're quiet: faded. */
export const Voice: Story = {};
/** Their voice while they speak: the speaking cue. */
export const Talking: Story = { args: { talking: true } };
/** Muted: its own icon. */
export const Muted: Story = { args: { muted: true, label: "Unmute Ana's voice" } };
/** Their screen's sound, its slider open. */
export const SoundOpen: Story = {
  args: { kind: "sound", label: "Mute the screen's sound", tip: "Screen sound", active: true },
};
/** Nothing to hear: greyed, saying why. */
export const Unavailable: Story = { args: { kind: "sound", unavailable: "No screen sound", tip: "Screen sound" } };
