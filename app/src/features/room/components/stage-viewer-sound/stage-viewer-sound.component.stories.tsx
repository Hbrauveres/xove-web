import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageViewerSound } from "./stage-viewer-sound.component";

const meta = {
  title: "Room/Stage viewer sound",
  component: StageViewerSound,
  args: {
    kind: "sound",
    sound: { volume: 0.7, muted: false, onChange: () => undefined },
    open: true,
    quiet: true,
    setOpen: () => undefined,
    anchorRef: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "10rem var(--space-6) var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageViewerSound>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The screen's sound, its slider open over it. */
export const SliderOpen: Story = {};
/** Their voice while they speak. */
export const Talking: Story = { args: { kind: "voice", name: "Bruno", talking: true, open: false, quiet: false } };
