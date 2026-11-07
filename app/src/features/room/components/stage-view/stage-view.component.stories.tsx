import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageView } from "./stage-view.component";

const noop = () => undefined;
/** A track that plays nothing. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };
const screen = {
  kind: "screen" as const,
  startedAt: 0,
  settings: { quality: "1080p" as const, mode: "sharp" as const },
  remote: { video: silence, setQuality: noop },
};
const bruno = { person: { id: "bruno", name: "Bruno", hue: 30, online: true }, isMe: false, since: 0, screen };

const meta = {
  title: "Room/Stage view",
  component: StageView,
  args: {
    big: null,
    main: null,
    sound: { volume: 1, muted: false },
    ambilight: { on: true, brightness: 0.9 },
    shape: 16 / 9,
    lightKey: "none",
    video: null,
    onVideo: noop,
    onSwap: noop,
    fold: { folded: false, hide: noop, show: noop, setBox: noop, setHide: noop, setCorner: noop },
    canShareScreen: true,
    onStart: noop,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          margin: "var(--space-12)",
          aspectRatio: "16 / 9",
          width: "var(--card-width)",
          containerType: "size",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageView>;

export default meta;

/** Nobody live: the TV on standby, the wall lit. */
export const Standby: StoryObj<typeof meta> = {};
/** Bruno's screen on the stage. */
export const Playing: StoryObj<typeof meta> = { args: { big: bruno, main: screen, lightKey: "bruno" } };

/** Nobody live, the ambilight switched off: no light on the wall. */
export const LightOff: StoryObj<typeof meta> = { args: { ambilight: { on: false, brightness: 0.9 } } };
