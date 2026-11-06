import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { MenuRow } from "./menu-row.component";

const meta: Meta<typeof MenuRow> = {
  title: "Shared/Menu row",
  component: MenuRow,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ width: "var(--settings-width)", padding: "var(--space-1-5)", background: "var(--surface)" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MenuRow>;

export const Action: Story = { args: { icon: "sign-out", label: "Sign out", onPick: () => undefined } };
/** Goes to a page. */
export const Link: Story = { args: { icon: "shield", label: "Admin", to: "/admin" } };
/** Can't be used now: dimmed, and a click says why. */
export const Unavailable: Story = {
  args: {
    icon: "screen-off",
    label: "Share your screen",
    unavailable: "This browser can't share a screen",
    onPick: () => undefined,
  },
};
