import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "./wordmark.component";

const meta = {
  title: "Shared/Wordmark",
  component: Wordmark,
  args: { height: 40 },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--ground)", color: "var(--text)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};
export const Icon: Story = { args: { variant: "icon", height: 64 } };
