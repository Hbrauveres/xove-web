import type { Meta, StoryObj } from "@storybook/react-vite";
import { Face } from "./face.component";

const meta = {
  title: "Shared/Face",
  component: Face,
  args: { name: "Marina", hue: 12, size: 32 },
} satisfies Meta<typeof Face>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In the room: the person's colour and initial. */
export const InTheRoom: Story = {};
/** Live, with the ring around the face (the people panel). */
export const Live: Story = { args: { size: 30, onAir: true } };
/** Live, the ring inside the edge (who's on the stage). */
export const LiveInside: Story = { args: { size: 52, onAir: true, ring: "inside" } };
/** The smallest, in a preview. */
export const Small: Story = { args: { size: 16 } };
/** On the account's pages, with no photo: the initial in the accent. */
export const AccountInitial: Story = { args: { name: "Sam Rocha", hue: undefined, size: 36 } };
