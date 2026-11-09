import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@shared/stores/auth-store";
import { RoomPage } from "./room-page.page";

type Seat = { status: "waiting"; place: number } | { status: "offered"; until: string; seconds: number };

/** The API, as far as the room page asks it before I'm in: who I am, the streams, and my place. */
function answerAs(seat: Seat) {
  const me = {
    id: 1,
    name: "Henrique Brauveres",
    email: "h@example.com",
    avatarUrl: null,
    status: "MEMBER",
    admin: false,
  };
  const streams = { streams: [], free: 6, places: 6, seated: false, seats: { total: 20, taken: 20, waiting: 2 } };
  const bodies: Record<string, unknown> = {
    "GET /api/me": me,
    "GET /api/streams": streams,
    "POST /api/room/enter": seat,
  };
  window.fetch = async (input, init) => {
    const path = new URL(String(input), location.origin).pathname;
    const body = bodies[`${init?.method ?? "GET"} ${path}`];
    return body === undefined ? new Response(null, { status: 204 }) : Response.json(body);
  };
}

const meta: Meta<typeof RoomPage> = {
  title: "Room/Room page",
  component: RoomPage,
  args: { pollMs: 60_000 },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RoomPage>;

/** The room is full: my place in the queue. In the room, each area has its own stories. */
export const Waiting: Story = { beforeEach: () => answerAs({ status: "waiting", place: 2 }) };

/** A seat is free for me: the offer over the waiting room. */
export const SeatOffered: Story = {
  beforeEach: () => answerAs({ status: "offered", until: new Date(Date.now() + 30_000).toISOString(), seconds: 30 }),
};
