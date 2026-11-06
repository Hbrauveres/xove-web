import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageStartButtons } from "./stage-start-buttons.component";

const meta = {
  title: "Room/Stage start buttons",
  component: StageStartButtons,
  args: { canShareScreen: true, onStart: () => undefined },
} satisfies Meta<typeof StageStartButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Both: Story = {};
/** A browser that can't share a screen: the camera first, the screen greyed. */
export const NoScreen: Story = { args: { canShareScreen: false } };
