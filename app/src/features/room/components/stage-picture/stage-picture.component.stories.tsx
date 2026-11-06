import type { Meta, StoryObj } from "@storybook/react-vite";
import { StagePicture } from "./stage-picture.component";

const bruno = {
  person: { id: "bruno", name: "Bruno", hue: 30, online: true },
  isMe: false,
  since: 0,
};
const screen = {
  kind: "screen" as const,
  startedAt: 0,
  settings: { quality: "1080p" as const, mode: "sharp" as const },
};

const meta = {
  title: "Room/Stage picture",
  component: StagePicture,
  args: {
    big: { ...bruno, screen },
    main: screen,
    sound: { volume: 1, muted: false },
    facecam: { place: { x: 0.73, y: 0.04 }, collapsed: false },
    onFacecamMove: () => undefined,
    onFacecamCollapse: () => undefined,
    onSwap: () => undefined,
    onVideo: () => undefined,
  },
  decorators: [
    (Story) => (
      <div
        style={{ position: "relative", aspectRatio: "16 / 9", width: "var(--card-width)", background: "var(--black)" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StagePicture>;

export default meta;

/** Bruno's screen on its way: a notice until the video arrives. */
export const Loading: StoryObj<typeof meta> = {};
