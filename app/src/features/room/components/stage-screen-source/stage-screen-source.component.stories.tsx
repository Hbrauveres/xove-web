import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageScreenSource } from "./stage-screen-source.component";

const meta = {
  title: "Room/Stage screen source",
  component: StageScreenSource,
  args: { surface: "browser" },
} satisfies Meta<typeof StageScreenSource>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A tab. */
export const Tab: Story = {};
/** Not known yet. */
export const Unknown: Story = { args: { surface: undefined } };
