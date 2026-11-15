import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequestAccessForm } from "./request-access-form.component";

const meta = {
  title: "Request access/Form",
  component: RequestAccessForm,
  args: { declined: false, onSent: () => Promise.resolve() },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", display: "grid", gap: "var(--space-3-5)", padding: "var(--space-6)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RequestAccessForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed in, not a member yet. */
export const Ask: Story = {};
/** The last request was declined. */
export const Declined: Story = { args: { declined: true } };
