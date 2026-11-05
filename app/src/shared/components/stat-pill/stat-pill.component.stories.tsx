import type { Meta, StoryObj } from "@storybook/react-vite";
import { Face } from "@shared/components/face";
import { Icon } from "@shared/components/icon";
import { StatPill } from "./stat-pill.component";

const meta = {
  title: "Shared/Stat pill",
  component: StatPill,
  args: { lead: <Icon name="eye" size={16} />, count: 3, unit: "watching" },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-4)", background: "var(--ground)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Where faces can't show. */
export const Eye: Story = {};
/** Who's watching, by their faces. */
export const Faces: Story = {
  args: {
    lead: (
      <>
        <Face name="Rafa" hue={260} size={20} />
        <Face name="Ana" hue={150} size={20} />
      </>
    ),
    count: 2,
  },
};
