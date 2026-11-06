import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageView } from "./stage-view.component";

const noop = () => undefined;

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
