import type { Meta, StoryObj } from "@storybook/react-vite";
import { Picker } from "./picker.component";

const meta = {
  title: "Shared/Picker",
  component: Picker,
  args: {
    label: "Camera",
    value: "c920",
    onChange: () => undefined,
    options: [
      { value: "c920", label: "Webcam C920" },
      { value: "facecam", label: "Elgato Facecam" },
    ],
  },
  decorators: [
    (Story) => (
      <div
        data-list-host
        style={{ width: "var(--settings-width)", padding: "var(--space-4)", background: "var(--surface)" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Picker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
/** Its list open, floating over its panel. */
export const Open: Story = { args: { open: true } };
export const Disabled: Story = { args: { disabled: true } };
/** Pointed at from elsewhere. */
export const Cued: Story = { args: { cue: 1 } };
