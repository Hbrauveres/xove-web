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
/** A track that plays nothing: the story shows what's around the picture. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };
const remote = { video: silence, setQuality: () => undefined };

const meta = {
  title: "Room/Stage picture",
  component: StagePicture,
  args: {
    big: { ...bruno, screen },
    main: screen,
    sound: { volume: 1, muted: false },
    facecamPlace: { x: 0.73, y: 0.04 },
    onFacecamMove: () => undefined,
    fold: {
      folded: false,
      hide: () => undefined,
      show: () => undefined,
      setBox: () => undefined,
      setHide: () => undefined,
      setCorner: () => undefined,
    },
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
/** Bruno's screen playing. */
export const Playing: StoryObj<typeof meta> = {
  args: { big: { ...bruno, screen: { ...screen, remote } }, main: { ...screen, remote } },
};

/** Bruno's screen and camera: the camera in the facecam. */
export const WithFacecam: StoryObj<typeof meta> = {
  args: {
    big: { ...bruno, screen: { ...screen, remote }, camera: { ...screen, kind: "camera", remote } },
    main: { ...screen, remote },
    small: { ...screen, kind: "camera", remote },
  },
};

/** My own share, before its picture is there. */
export const Starting: StoryObj<typeof meta> = {
  args: { big: { ...bruno, isMe: true, screen }, main: screen },
};
