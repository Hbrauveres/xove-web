import type { Meta, StoryObj } from "@storybook/react-vite";
import { aStreamControls } from "@testing/factories/stream-controls.factory";
import { StagePlayerButtons } from "./stage-player-buttons.component";

const meta = {
  title: "Room/Stage player buttons",
  component: StagePlayerButtons,
  args: { ...aStreamControls(), mine: { screen: true, camera: false } },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: "48rem", aspectRatio: "16 / 9", background: "var(--grey-22-90)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StagePlayerButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/** My screen live: my buttons, L 48, centred over the bottom. */
export const Live: Story = {};
