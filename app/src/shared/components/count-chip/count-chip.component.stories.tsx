import type { Meta, StoryObj } from "@storybook/react-vite";
import { CountChip } from "./count-chip.component";

const meta = {
  title: "Shared/Count chip",
  component: CountChip,
  args: { count: 12 },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-4)", background: "var(--ground)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CountChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
/** Something waits for you. */
export const Attention: Story = { args: { count: 2, tone: "attention" } };
