import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageControls } from "./stage-controls.component";

const noop = () => undefined;
const hear = { sound: { volume: 1, muted: false }, voice: { volume: 1, muted: false } };

const meta = {
  title: "Room/Stage controls",
  component: StageControls,
  args: {
    big: null,
    controls: {
      mine: { screen: false, camera: false },
      free: 6,
      cameras: [],
      camera: null,
      canShareScreen: true,
      onStart: noop,
      onStop: noop,
      onChangeWindow: noop,
      onPickCamera: noop,
      settingsOpen: false,
      onSettings: noop,
    },
    hearing: { hearOf: () => hear, setHear: noop } as never,
    onStart: noop,
    onSettings: noop,
    onMenuChange: noop,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          width: "var(--card-width)",
          background: "var(--surface)",
          containerType: "size",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageControls>;

export default meta;

/** Nobody live: only the settings, in the corner. */
export const NobodyLive: StoryObj<typeof meta> = {};
