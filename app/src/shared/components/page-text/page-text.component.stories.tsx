import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageText } from "./page-text.component";

const meta = {
  title: "Shared/Page text",
  component: PageText,
  args: {
    variant: "lead",
    children: "Share your screen or camera in sharp, fast streams. Watch them play, hang out, help out. Invite only.",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--home-card-width)", padding: "var(--space-6)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under the page's heading. */
export const Lead: Story = {};
/** A quiet note. */
export const Note: Story = {
  args: { variant: "note", children: "New here? Sign in and ask for access. The owner approves each person." },
};
