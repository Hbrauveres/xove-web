import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdminRemoveConfirm } from "./admin-remove-confirm.component";

const meta = {
  title: "Admin/Remove, asked first",
  component: AdminRemoveConfirm,
  args: { firstName: "Ana", asking: false, busy: false, onAsk: () => undefined, onRemove: () => undefined },
} satisfies Meta<typeof AdminRemoveConfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Remove, before it asks. */
export const Remove: Story = {};
/** Asking: "Remove Ana" or Cancel. */
export const Asking: Story = { args: { asking: true } };
/** Asking while another action runs: the confirming button waits. */
export const AskingWhileBusy: Story = { args: { asking: true, busy: true } };
