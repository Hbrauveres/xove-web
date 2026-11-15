import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@shared/stores/auth-store";
import { RequestAccessPage } from "./request-access.page";

/** The API, as far as the page asks it: who I am, with my request's status. */
function answerAs(status: "NONE" | "PENDING" | "DECLINED") {
  const me = { id: 7, name: "Rafa Lima", email: "friend@example.com", avatarUrl: null, status, admin: false };
  const real = window.fetch;
  window.fetch = async (input) => {
    const path = new URL(String(input), location.origin).pathname;
    return path === "/api/me" ? Response.json(me) : new Response(null, { status: 204 });
  };
  // The next story gets the real fetch back.
  return () => {
    window.fetch = real;
  };
}

const meta: Meta<typeof RequestAccessPage> = {
  title: "Request access/Page",
  component: RequestAccessPage,
  parameters: { layout: "fullscreen" },
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
type Story = StoryObj<typeof RequestAccessPage>;

/** Signed in, not a member: ask for access. */
export const Ask: Story = { beforeEach: () => answerAs("NONE") };
/** The request went: the wait. */
export const Waiting: Story = { beforeEach: () => answerAs("PENDING") };
/** The last request was declined. */
export const Declined: Story = { beforeEach: () => answerAs("DECLINED") };
