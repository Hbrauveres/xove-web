import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderActivityTicker } from "./header-activity-ticker.component";

const meta = {
  title: "Room/Header activity ticker",
  component: HeaderActivityTicker,
  args: {
    reconnecting: null,
    latest: {
      id: "1",
      text: "Ana started sharing",
      ago: "now",
      actor: { id: "ana", name: "Ana", hue: 300, online: true },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", width: "var(--card-width)", color: "var(--text)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeaderActivityTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Latest: Story = {};
export const Quiet: Story = { args: { latest: null } };
export const Reconnecting: Story = { args: { reconnecting: "Connection dropped. Reconnecting" } };
