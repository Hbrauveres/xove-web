import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdminMembers } from "./admin-members.component";

const meta = {
  title: "Admin/Members",
  component: AdminMembers,
  args: {
    members: [
      { id: 1, email: "admin@example.com", name: "Henrique", avatarUrl: null, admin: true },
      { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
    ],
    busy: false,
    asking: null,
    onAsk: () => undefined,
    onRemove: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", padding: "var(--space-6)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminMembers>;

export default meta;

/** An admin and a member. */
export const Members: StoryObj<typeof meta> = {};
