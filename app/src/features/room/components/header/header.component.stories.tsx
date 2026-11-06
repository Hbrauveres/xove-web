import type { Meta, StoryObj } from "@storybook/react-vite";
import { Header } from "./header.component";

const meta = {
  title: "Room/Header",
  component: Header,
  args: {
    middle: <span style={{ color: "var(--text-muted)" }}>The activity</span>,
    right: <span style={{ color: "var(--text-muted)" }}>People · Me</span>,
  },
} satisfies Meta<typeof Header>;

export default meta;

/** The bar, with stand-ins for its pieces. */
export const Bar: StoryObj<typeof meta> = {};
