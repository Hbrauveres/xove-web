import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageScreenVideo } from "./stage-screen-video.component";

const meta = {
  title: "Room/Stage screen video",
  component: StageScreenVideo,
  args: { label: "Bruno's shared screen" },
  decorators: [
    (Story) => (
      <div
        style={{ position: "relative", aspectRatio: "16 / 9", width: "var(--card-width)", background: "var(--black)" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageScreenVideo>;

export default meta;

/** Before its picture arrives: the stage's black. */
export const Waiting: StoryObj<typeof meta> = {};
/** A track that plays nothing. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };

/** Someone's screen with its sound, at half volume. */
export const WithSound: StoryObj<typeof meta> = { args: { video: silence, sound: silence, volume: 0.5 } };
