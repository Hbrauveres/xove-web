import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageSoundSlider } from "./stage-sound-slider.component";

const meta = {
  title: "Room/Stage sound slider",
  component: StageSoundSlider,
  args: { kind: "voice", sound: { volume: 0.7, muted: false }, label: "Ana's voice volume" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: "8rem", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageSoundSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Their voice's volume. */
export const Voice: Story = {};
/** Their screen's sound, muted: its own icon. */
export const SoundMuted: Story = {
  args: { kind: "sound", sound: { volume: 0.7, muted: true }, label: "Screen sound volume" },
};
