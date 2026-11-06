import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderActivityPill } from "./header-activity-pill.component";

const now = Date.now();

const meta = {
  title: "Room/Header activity pill",
  component: HeaderActivityPill,
  args: {
    events: [
      { id: "1", kind: "joined", actorId: "diego", at: now - 120_000 },
      { id: "2", kind: "started", actorId: "ana", at: now, stream: "screen" },
    ],
    people: [
      { id: "me", name: "Henrique", hue: 210, online: true },
      { id: "ana", name: "Ana", hue: 300, online: true },
      { id: "diego", name: "Diego", hue: 90, online: true },
    ],
    meId: "me",
    connection: "connected",
    isLive: () => true,
    watching: null,
    onWatch: () => undefined,
  },
} satisfies Meta<typeof HeaderActivityPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ana's screen just started; two events not seen yet. */
export const Latest: Story = {};
/** Before anything happened. */
export const Quiet: Story = { args: { events: [] } };
/** The connection dropped: the pill says so, in yellow. */
export const Reconnecting: Story = { args: { connection: "reconnecting" } };
