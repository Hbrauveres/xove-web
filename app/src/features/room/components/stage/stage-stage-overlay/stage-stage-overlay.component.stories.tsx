import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageStageOverlay } from "./stage-stage-overlay.component";

const meta = {
  title: "Room/Stage overlay",
  component: StageStageOverlay,
  args: { fullscreen: false, onFullscreen: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: "40rem", aspectRatio: "16 / 9", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageStageOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The fullscreen button, M 34, in the stage's corner. */
export const Fullscreen: Story = {};
/** Fullscreen: the button leaves it. */
export const InFullscreen: Story = { args: { fullscreen: true } };
