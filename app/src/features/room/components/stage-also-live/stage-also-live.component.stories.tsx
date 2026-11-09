import type { Meta, StoryObj } from "@storybook/react-vite";
import { aSharer } from "@testing/factories/sharer.factory";
import { aTrack } from "@testing/factories/track.factory";
import { StageAlsoLive } from "./stage-also-live.component";

const heard = { volume: 1, muted: false };

const meta = {
  title: "Room/Stage also live",
  component: StageAlsoLive,
  args: {
    others: [aSharer({ id: "user-3", name: "Ana" }), aSharer({ id: "user-9", name: "Diego", kinds: ["camera"] })],
    liveCount: 3,
    places: 6,
    free: 3,
    onPick: () => undefined,
    hearOf: () => ({ sound: heard, voice: heard }),
    onHear: () => undefined,
  },
} satisfies Meta<typeof StageAlsoLive>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two other streams, then the places: three of six live. */
export const TwoOthers: Story = {};
/** A room set to four places. */
export const FourPlaces: Story = { args: { places: 4, free: 1 } };
/** I'm live and watch someone else, my voice being sent: my own preview's ring lit. */
export const MineTalking: Story = {
  args: {
    others: [
      {
        person: { id: "user-99", name: "Henrique", hue: 210, online: true },
        isMe: true,
        since: Date.now(),
        screen: {
          kind: "screen",
          startedAt: Date.now(),
          settings: { quality: "1080p", mode: "smooth" },
          local: aTrack(),
        },
        hasSound: false,
      },
      aSharer({ id: "user-3", name: "Ana" }),
    ],
    meTalking: true,
  },
};
