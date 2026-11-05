import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider.component";

const meta = {
  title: "Shared/Slider",
  component: Slider,
  args: { "aria-label": "Volume", min: 0, max: 1, step: 0.05, value: 0.6, onChange: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--settings-width)", padding: "var(--space-4)", background: "var(--surface)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Partway: Story = {};
export const Empty: Story = { args: { value: 0 } };
export const Full: Story = { args: { value: 1 } };
