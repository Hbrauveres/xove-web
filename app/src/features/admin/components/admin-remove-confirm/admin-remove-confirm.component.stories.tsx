import type { Meta, StoryObj } from "@storybook/react-vite";
import { AdminRemoveConfirm } from "./admin-remove-confirm.component";

const meta = {
  title: "Admin/Remove, asked first",
  component: AdminRemoveConfirm,
  args: { firstName: "Ana", busy: false, onRemove: () => Promise.resolve() },
} satisfies Meta<typeof AdminRemoveConfirm>;

export default meta;

/** Remove, before it asks; a click asks "Remove Ana" or Cancel. */
export const Remove: StoryObj<typeof meta> = {};
