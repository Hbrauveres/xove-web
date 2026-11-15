import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { AdminHeader } from "./admin-header.component";

const meta = {
  title: "Admin/Header",
  component: AdminHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ width: "var(--admin-width)", padding: "0 var(--space-6)" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AdminHeader>;

export default meta;

/** The mark, "admin", and the way back. */
export const Header: StoryObj<typeof meta> = {};
