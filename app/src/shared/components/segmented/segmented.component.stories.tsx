import type { Meta, StoryObj } from "@storybook/react-vite";
import { Segmented } from "./segmented.component";

const meta = {
  title: "Shared/Segmented",
  component: Segmented,
  args: {
    label: "Mode",
    options: [
      { value: "smooth", label: "Smooth", title: "Keeps motion fluid" },
      { value: "sharp", label: "Sharp", title: "Keeps detail sharp" },
    ],
    value: "smooth",
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--settings-width)", padding: "var(--space-4)", background: "var(--surface)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Segmented>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Two: Story = {};
export const Three: Story = {
  args: {
    label: "Quality",
    options: [
      { value: "1080p", label: "1080p" },
      { value: "720p", label: "720p" },
      { value: "480p", label: "480p" },
    ],
    value: "720p",
  },
};
export const Disabled: Story = { args: { disabled: true } };
