import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdminRequests } from "./admin-requests.component";

const meta = {
  title: "Admin/Requests",
  component: AdminRequests,
  args: {
    requests: [
      {
        id: 7,
        email: "bruno@example.com",
        name: "Bruno",
        avatarUrl: null,
        message: "Hey, it's me from the Saturday games.",
        createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      },
    ],
    busy: false,
    onApprove: () => undefined,
    onDecline: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", padding: "var(--space-6)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminRequests>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One person waiting. */
export const OneWaiting: Story = {};
/** No one waiting. */
export const Empty: Story = { args: { requests: [] } };
