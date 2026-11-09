import type { Meta, StoryObj } from "@storybook/react-vite";
import type { RoomSession } from "../../stores/room-session";
import { RoomSessionContext } from "../../stores/room-session";
import type { Friend } from "../../types/room-view.types";
import { Header } from "./header.component";

const noop = () => undefined;
const me: Friend = { id: "me", name: "Henrique", hue: 210, online: true };
const marina: Friend = { id: "marina", name: "Marina", hue: 330, online: true };
const people = [me, marina];

/** The header as the room shows it: Marina and me, nobody live. */
const session = {
  header: {
    activity: {
      events: [],
      people,
      meId: me.id,
      connection: "connected",
      isLive: () => false,
      watching: null,
      onWatch: noop,
    },
    people: { people, meId: me.id, sharing: {}, watchingOf: {}, seats: null },
    me: {
      me,
      isAdmin: false,
      connection: "connected",
      ambilight: { on: true, brightness: 0.9 },
      onAmbilightChange: noop,
      onSignOut: noop,
    },
  },
} as unknown as RoomSession;

const meta = {
  title: "Room/Header",
  component: Header,
  decorators: [
    (Story) => (
      <RoomSessionContext.Provider value={session}>
        <Story />
      </RoomSessionContext.Provider>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;

/** The bar: the logo, the activity, the people and my account. */
export const Bar: StoryObj<typeof meta> = {};
