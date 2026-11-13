import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageVideoFrame } from "./stage-video-frame.component";

const meta = {
  title: "Room/Stage video frame",
  component: StageVideoFrame,
  args: { children: null },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--strip-item)", padding: "var(--space-4)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageVideoFrame>;

export default meta;

/** An empty frame: black, rounded, its hairline inside. */
export const Empty: StoryObj<typeof meta> = {};
