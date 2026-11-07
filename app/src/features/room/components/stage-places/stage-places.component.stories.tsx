import type { Meta, StoryObj } from "@storybook/react-vite";
import { StagePlaces } from "./stage-places.component";

const meta = {
  title: "Room/Stage places",
  component: StagePlaces,
  args: { liveCount: 3, places: 6, free: 3 },
} satisfies Meta<typeof StagePlaces>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three of six live. */
export const Half: Story = {};
/** A room set to four places, one free. */
export const FourPlaces: Story = { args: { liveCount: 3, places: 4, free: 1 } };
