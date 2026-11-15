import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdminMemberRow } from "./admin-member-row.component";

const meta = {
  title: "Admin/Member row",
  component: AdminMemberRow,
  args: {
    member: { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
    busy: false,
    onRemove: () => Promise.resolve(),
  },
  decorators: [
    (Story) => (
      <ul style={{ listStyle: "none", margin: 0, padding: "var(--space-6)", width: "var(--card-width)" }}>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof AdminMemberRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member, with Remove. */
export const Member: Story = {};
/** An admin: never removed here. */
export const Admin: Story = {
  args: { member: { id: 1, email: "admin@example.com", name: "Henrique", avatarUrl: null, admin: true } },
};
