import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import type { ReactNode } from "react";
import { Button } from "./button.component";
import type { ButtonProps, ButtonVariant } from "./types/button.types";

/** A button or a link, by whether it has somewhere to go. */
type Args = {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  to?: string;
  href?: string;
  children: ReactNode;
};

const meta = {
  title: "Shared/Button",
  args: { children: "Request access" },
  render: (args) => <Button {...(args as ButtonProps)} />,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Danger: Story = { args: { variant: "danger", children: "Decline" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Cancel" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true, children: "Sending…" } };
export const Quiet: Story = { args: { variant: "quiet", children: "Use another account" } };
export const QuietLink: Story = { args: { variant: "quiet", to: "/room", children: "Back to the room" } };
export const LightLink: Story = { args: { variant: "light", href: "#", children: "Continue with Google" } };
