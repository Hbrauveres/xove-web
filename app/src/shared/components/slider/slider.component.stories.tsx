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
/** A threshold (the mic's sensitivity): the line knob, the live level in the track, faint under the line. */
export const Threshold: Story = {
  args: { variant: "threshold", "aria-label": "Mic sensitivity", value: 0.3, level: 0.2, sent: false },
};
/** A threshold with the level past the line: sent, green. */
export const ThresholdSent: Story = { args: { ...Threshold.args, level: 0.6, sent: true } };
