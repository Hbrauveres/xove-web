import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionHeading } from "./section-heading.component";

const meta = {
  title: "Shared/Section heading",
  component: SectionHeading,
  args: { children: "Members", count: 12 },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-4)", background: "var(--ground)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Count: Story = {};
/** Something there needs you. */
export const Attention: Story = { args: { children: "Waiting for access", count: 2, attention: true } };
