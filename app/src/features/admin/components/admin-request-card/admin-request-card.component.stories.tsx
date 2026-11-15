import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdminRequestCard } from "./admin-request-card.component";

const meta = {
  title: "Admin/Request card",
  component: AdminRequestCard,
  args: {
    request: {
      id: 7,
      email: "bruno@example.com",
      name: "Bruno",
      avatarUrl: null,
      message: "Hey, it's me from the Saturday games.",
      createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    },
    busy: false,
    onApprove: () => undefined,
    onDecline: () => undefined,
  },
  decorators: [
    (Story) => (
      <ul style={{ listStyle: "none", margin: 0, padding: "var(--space-6)", width: "var(--card-width)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof AdminRequestCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Someone asking, with a note. */
export const WithNote: Story = {};
/** While another action runs. */
export const Busy: Story = { args: { busy: true } };
