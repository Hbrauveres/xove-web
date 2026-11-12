import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderActivityList } from "./header-activity-list.component";

const now = Date.now();
const minutes = (n: number) => now - n * 60_000;

const meta = {
  title: "Room/Header activity list",
  component: HeaderActivityList,
  args: {
    events: [
      { id: "1", kind: "joined", actorId: "me", at: minutes(15) },
      { id: "2", kind: "started", actorId: "bruno", at: minutes(13), stream: "screen" },
      { id: "3", kind: "started", actorId: "ana", at: minutes(2), stream: "camera" },
      { id: "4", kind: "left", actorId: "diego", at: minutes(1) },
    ],
    people: [
      { id: "me", name: "Henrique", hue: 210, online: true },
      { id: "bruno", name: "Bruno", hue: 30, online: true },
      { id: "ana", name: "Ana", hue: 300, online: true },
      { id: "diego", name: "Diego", hue: 90, online: true },
    ],
    meId: "me",
    unseen: new Set(["4"]),
    isLive: (personId) => personId !== "diego",
    watching: { personId: "bruno", kind: "screen" },
    onWatch: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", background: "var(--surface)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeaderActivityList>;

export default meta;

/** Bruno's screen on my stage, Ana's camera to watch, Diego's leaving not seen yet. */
export const List: StoryObj<typeof meta> = {};
