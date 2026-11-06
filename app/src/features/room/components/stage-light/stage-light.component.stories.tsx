import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageLight } from "./stage-light.component";

const meta = {
  title: "Room/Stage light",
  component: StageLight,
  args: { video: null, prefs: { on: true, brightness: 0.9 } },
} satisfies Meta<typeof StageLight>;

export default meta;

/** With no stream there's no light at all: the empty stage has its own glow. Its look is in the room's stories. */
export const NoStream: StoryObj<typeof meta> = {};
