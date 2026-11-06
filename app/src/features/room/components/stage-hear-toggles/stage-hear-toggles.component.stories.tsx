import type { Meta, StoryObj } from "@storybook/react-vite";
import { aSharer } from "@testing/factories/sharer.factory";
import { StageHearToggles } from "./stage-hear-toggles.component";

const heard = { volume: 1, muted: false };

const meta = {
  title: "Room/Stage hear toggles",
  component: StageHearToggles,
  args: {
    sharer: aSharer({ kinds: ["screen", "camera"], hasSound: true, hasVoice: true }),
    hearing: { sound: heard, voice: heard },
    onChange: () => undefined,
    swap: { on: false, onSwap: () => undefined },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "8rem", padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageHearToggles>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A preview's row: their voice, their screen's sound and the swap, three M 34 round buttons. */
export const Row: Story = {};
/** Their voice while they speak. */
export const Talking: Story = { args: { sharer: aSharer({ hasSound: true, hasVoice: true, speaking: true }) } };
/** No screen sound, their mic off: greyed in place. */
export const NothingToHear: Story = {
  args: { sharer: aSharer({ hasSound: false, hasVoice: false }), swap: undefined },
};
