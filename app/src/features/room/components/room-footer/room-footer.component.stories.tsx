import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoomFooter } from "./room-footer.component";

const meta = {
  title: "Room/Footer",
  component: RoomFooter,
} satisfies Meta<typeof RoomFooter>;

export default meta;

/** The slim footer: who made it, and the links to come. */
export const Footer: StoryObj<typeof meta> = {};
