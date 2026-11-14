import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveDot } from "./live-dot.component";

const meta = {
  title: "Shared/Live dot",
  component: LiveDot,
  args: { size: "m" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LiveDot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** M 8: on a pill (Go live). */
export const M: Story = {};
/** S 6: on a tab. */
export const S: Story = { args: { size: "s" } };
