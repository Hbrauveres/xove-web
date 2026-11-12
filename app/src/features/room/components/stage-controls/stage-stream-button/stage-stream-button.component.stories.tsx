import type { Meta, StoryObj } from "@storybook/react-vite";
import { aStreamControls } from "@testing/factories/stream-controls.factory";
import { StageStreamButton } from "./stage-stream-button.component";

const meta = {
  title: "Room/Stage stream button",
  component: StageStreamButton,
  args: { kind: "screen", ...aStreamControls() },
  decorators: [
    (Story) => (
      <div style={{ padding: "8rem var(--space-6) var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageStreamButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** My screen, off: L 48, the crossed monitor. */
export const ScreenOff: Story = {};
/** My screen, live: red. */
export const ScreenLive: Story = { args: { mine: { screen: true, camera: false } } };
/** A full room: faded, saying why. */
export const Full: Story = { args: { kind: "camera", free: 0 } };
