import type { Meta, StoryObj } from "@storybook/react-vite";
import { ControlLabel } from "./control-label.component";

const meta = {
  title: "Shared/Control label",
  component: ControlLabel,
  args: { children: "Quality" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-4)", background: "var(--surface)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ControlLabel>;

export default meta;

export const Label: StoryObj<typeof meta> = {};
