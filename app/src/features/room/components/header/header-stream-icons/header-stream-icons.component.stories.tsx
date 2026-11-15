import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderStreamIcons } from "./header-stream-icons.component";

const meta = {
  title: "Room/Header/Stream icons",
  component: HeaderStreamIcons,
  args: { kinds: ["screen", "camera"] },
} satisfies Meta<typeof HeaderStreamIcons>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sharing screen and camera. */
export const Both: Story = {};
/** Sharing the screen alone. */
export const Screen: Story = { args: { kinds: ["screen"] } };
