import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button.component";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: { children: "Request access" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Danger: Story = { args: { variant: "danger", children: "Decline" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Cancel" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true, children: "Sending…" } };
