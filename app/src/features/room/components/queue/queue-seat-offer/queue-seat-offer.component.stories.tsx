import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueueSeatOffer } from "./queue-seat-offer.component";

const noop = () => undefined;

const meta = {
  title: "Room/Queue/Seat offer",
  component: QueueSeatOffer,
  args: { seconds: 60, onEnter: noop, onCancel: noop },
} satisfies Meta<typeof QueueSeatOffer>;

export default meta;

/** A seat is free for me: a minute to enter, the page behind dimmed. */
export const Offered: StoryObj<typeof meta> = {};
