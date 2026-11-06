import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageFacecam } from "./stage-facecam.component";

const meta = {
  title: "Room/Stage facecam",
  component: StageFacecam,
  args: {
    label: "Bruno's camera",
    // Only drawn here: there's no player to move it in.
    player: { current: null },
    place: { x: 0.73, y: 0.04 },
    fold: {
      folded: false,
      hide: () => undefined,
      show: () => undefined,
      setBox: () => undefined,
      setHide: () => undefined,
      setCorner: () => undefined,
    },
    onSwap: () => undefined,
    onMove: () => undefined,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          width: "var(--card-width)",
          background: "var(--surface)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageFacecam>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The small view over the screen, at the top right, with Swap and Hide. */
export const Open: Story = {};
