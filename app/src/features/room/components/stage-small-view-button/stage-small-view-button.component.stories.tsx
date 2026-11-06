import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageSmallViewButton } from "./stage-small-view-button.component";

const meta = {
  title: "Room/Stage small view button",
  component: StageSmallViewButton,
  args: {
    fold: {
      folded: true,
      hide: () => undefined,
      show: () => undefined,
      setBox: () => undefined,
      setHide: () => undefined,
      setCorner: () => undefined,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: "48rem", aspectRatio: "16 / 9", background: "var(--grey-22-90)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageSmallViewButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Folded: the picture-in-picture button, M 34, in the top-right corner. */
export const Folded: Story = {};
