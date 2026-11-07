import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageGoLiveRows } from "./stage-go-live-rows.component";

const meta = {
  title: "Room/Stage go live rows",
  component: StageGoLiveRows,
  args: { canShareScreen: true, onStart: () => undefined, onSettings: () => undefined, onPicked: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", width: "var(--viewer-menu-width)", padding: "var(--space-1-5)", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageGoLiveRows>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Go live's rows: the ways to start, then the settings. */
export const Rows: Story = {};
/** A full room: the ways to start greyed. */
export const Full: Story = { args: { full: "6 streams are live, the most at once. You can start yours when one stops." } };
