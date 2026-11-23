import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageEmptyScene } from "./stage-empty-scene.component";

const meta = {
  title: "Room/Stage empty scene",
  component: StageEmptyScene,
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          width: "var(--card-width)",
          background: "var(--grey-11)",
          containerType: "size",
          overflow: "hidden",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageEmptyScene>;

export default meta;

/** The sky, the eye, the horizon and the moving grid. */
export const Scene: StoryObj<typeof meta> = {};
