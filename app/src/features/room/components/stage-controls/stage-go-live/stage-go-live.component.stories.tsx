import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageGoLive } from "./stage-go-live.component";

const meta = {
  title: "Room/Stage go live",
  component: StageGoLive,
  args: { canShareScreen: true, onStart: () => undefined, onSettings: () => undefined },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "12rem var(--space-6) var(--space-6)",
          background: "var(--grey-15)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageGoLive>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Go live, an M action pill with the live dot; its menu opens above it. */
export const GoLive: Story = {};
/** A full room: its ways to start greyed, saying why. */
export const Full: Story = {
  args: { full: "6 streams are live, the most at once. You can start yours when one stops." },
};
