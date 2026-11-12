import type { Meta, StoryObj } from "@storybook/react-vite";
import type { RoomSession } from "../../../stores/room-session";
import { RoomSessionContext } from "../../../stores/room-session";
import { RoomError } from "./room-error.component";

const meta = {
  title: "Room/Room error",
  component: RoomError,
  decorators: [
    (Story) => (
      <RoomSessionContext.Provider value={{ error: "Couldn't reach the room. Trying again…" } as RoomSession}>
        <div style={{ position: "relative", height: "var(--settings-min-height)" }}>
          <Story />
        </div>
      </RoomSessionContext.Provider>
    ),
  ],
} satisfies Meta<typeof RoomError>;

export default meta;

/** A problem with the room, over the bottom of the middle. */
export const Problem: StoryObj<typeof meta> = {};
