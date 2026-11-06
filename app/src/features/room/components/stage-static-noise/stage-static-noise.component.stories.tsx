import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageStaticNoise } from "./stage-static-noise.component";

const meta = {
  title: "Room/Stage static noise",
  component: StageStaticNoise,
  decorators: [
    (Story) => (
      <div
        style={{ position: "relative", aspectRatio: "16 / 9", width: "var(--card-width)", background: "var(--black)" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageStaticNoise>;

export default meta;

/** The snow rolling behind the empty stage. */
export const Static: StoryObj<typeof meta> = {};
