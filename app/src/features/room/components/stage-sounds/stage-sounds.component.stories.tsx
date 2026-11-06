import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageSounds } from "./stage-sounds.component";

const meta = {
  title: "Room/Stage sounds",
  component: StageSounds,
  args: { voices: [], previewSounds: [] },
} satisfies Meta<typeof StageSounds>;

export default meta;

/** Plays what I hear; draws nothing. */
export const Silent: StoryObj<typeof meta> = {};
