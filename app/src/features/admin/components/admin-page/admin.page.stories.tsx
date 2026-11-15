import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { AdminPage } from "./admin.page";

/** The API, as far as admin asks it: who's waiting, and who's in; or no answer yet; or a refusal. */
function answerWith(requests: unknown[] | "pending" | "refused") {
  const members = [
    { id: 1, email: "admin@example.com", name: "Henrique", avatarUrl: null, admin: true },
    { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
  ];
  const bodies: Record<string, unknown> = { "/api/admin/access-requests": requests, "/api/admin/members": members };
  const real = window.fetch;
  window.fetch = async (input) => {
    if (requests === "pending") return new Promise<Response>(() => undefined);
    if (requests === "refused") return Response.json({ detail: "Admins only" }, { status: 403 });
    const body = bodies[new URL(String(input), location.origin).pathname];
    return body === undefined ? new Response(null, { status: 204 }) : Response.json(body);
  };
  // The next story gets the real fetch back.
  return () => {
    window.fetch = real;
  };
}

const meta: Meta<typeof AdminPage> = {
  title: "Admin/Page",
  component: AdminPage,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminPage>;

/** Someone waiting, and the members. */
export const Requests: Story = {
  beforeEach: () =>
    answerWith([
      {
        id: 7,
        email: "bruno@example.com",
        name: "Bruno",
        avatarUrl: null,
        message: "Hey, it's me from the Saturday games.",
        createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      },
    ]),
};
/** No one waiting. */
export const Empty: Story = { beforeEach: () => answerWith([]) };
/** The lists not in yet: the page's loading line. */
export const Loading: Story = { beforeEach: () => answerWith("pending") };
/** The lists refused: the API's words in the error box, under the bar. */
export const LoadFailed: Story = { beforeEach: () => answerWith("refused") };
