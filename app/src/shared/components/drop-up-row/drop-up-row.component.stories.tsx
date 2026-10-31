import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropUpRow } from "./drop-up-row.component";

const meta = {
  title: "Shared/Drop-up row",
  component: DropUpRow,
  args: { children: <span style={{ color: "var(--text)" }}>Your screen</span> },
} satisfies Meta<typeof DropUpRow>;

export default meta;

/** One frosted pill. */
export const Row: StoryObj<typeof meta> = {};
