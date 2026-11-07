import type { Meta, StoryObj } from "@storybook/react-vite";
import { aSharer } from "@testing/factories/sharer.factory";
import { StageNowWatching } from "./stage-now-watching.component";

const friend = (id: string, name: string, hue: number) => ({ id, name, hue, online: true });

const meta = {
  title: "Room/Stage now watching",
  component: StageNowWatching,
  args: {
    sharer: aSharer({ kinds: ["screen", "camera"], hasVoice: true }),
    watchers: [friend("user-2", "Henrique", 280), friend("user-3", "Rafa", 160)],
  },
} satisfies Meta<typeof StageNowWatching>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Who's on the stage, live, what and for how long, and who's watching. */
export const Watching: Story = {};
/** Nobody live: an invitation, with who's here. */
export const Nobody: Story = {
  args: { sharer: null, watchers: [], others: [friend("user-2", "Henrique", 280), friend("user-3", "Rafa", 160)] },
};
