import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueueWaitingRoom } from "./queue-waiting-room.component";

const noop = () => undefined;
const actions = { error: null, accept: noop, cancel: noop, rejoin: noop };

const meta = {
  title: "Room/Queue/Waiting room",
  component: QueueWaitingRoom,
  args: { seat: { status: { status: "waiting", place: 2 }, ...actions }, onSignOut: noop },
} satisfies Meta<typeof QueueWaitingRoom>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every seat taken: my place in the line. */
export const Waiting: Story = {};

/** Before the API answers. */
export const Looking: Story = { args: { seat: { status: null, ...actions } } };

/** After Cancel: join again, at the end of the line. */
export const Left: Story = { args: { seat: { status: { status: "left" }, ...actions } } };

/** A request failed: said under the line. */
export const Failed: Story = {
  args: {
    seat: { status: { status: "waiting", place: 1 }, ...actions, error: "Couldn't reach the room. Trying again…" },
  },
};
