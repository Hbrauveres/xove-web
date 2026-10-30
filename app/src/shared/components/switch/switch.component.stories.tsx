import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch.component";

const meta = {
  title: "Shared/Switch",
  component: Switch,
  args: { label: "Ambilight", checked: false, onToggle: () => undefined },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "var(--size-8)",
          minWidth: "var(--settings-width)",
          padding: "var(--space-4)",
          background: "var(--surface)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { checked: true } };
/** Can't be used here (a browser without it). */
export const Unavailable: Story = { args: { label: "Voice isolation", unavailable: true } };
