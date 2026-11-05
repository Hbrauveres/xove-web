import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "./field.component";

const meta = {
  title: "Shared/Field",
  component: Field,
  args: {
    label: "Message",
    hint: "(optional)",
    value: "",
    onChange: () => undefined,
    maxLength: 500,
    rows: 3,
    placeholder: "Hey, it's me from…",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "var(--card-width)",
          padding: "var(--space-6)",
          background: "var(--ground)",
          color: "var(--text)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Written: Story = { args: { value: "Hey, it's Marina from the Friday games." } };
