import type { Meta, StoryObj } from "@storybook/react-vite";
import { useHearing } from "../../hooks/use-hearing.hook";
import { StageControls } from "./stage-controls.component";
import type { StageControlsProps } from "./types/stage-controls.types";

const noop = () => undefined;
/** A track that plays nothing: the controls are what the story shows. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };
const screen = {
  kind: "screen" as const,
  startedAt: 0,
  settings: { quality: "1080p" as const, mode: "sharp" as const },
};
const bruno = { person: { id: "bruno", name: "Bruno", hue: 30, online: true }, isMe: false, since: 0 };

/** The bar, with what I hear from whoever is on the stage kept by the room's own hook. */
function Bar(props: Omit<StageControlsProps, "hearing">) {
  const hearing = useHearing(props.big ? [props.big] : [], props.big?.person.id ?? null);
  return <StageControls {...props} hearing={hearing} />;
}

const meta = {
  title: "Room/Stage controls",
  component: Bar,
  args: {
    anchor: null,
    big: null,
    controls: {
      mine: { screen: false, camera: false },
      places: 6,
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
} satisfies Meta<typeof Bar>;

export default meta;

/** Nobody live: only the settings, in the corner. */
export const NobodyLive: StoryObj<typeof meta> = {};
/** Over Bruno's screen: what I hear from him at the left, Go live at the right. */
export const Watching: StoryObj<typeof meta> = {
  args: { big: { ...bruno, hasSound: true, screen: { ...screen, remote: { video: silence, setQuality: noop } } } },
};

/** Over my own screen: my buttons in the middle, with my mic. */
export const MyStream: StoryObj<typeof meta> = {
  args: {
    big: {
      ...bruno,
      isMe: true,
      person: { ...bruno.person, id: "me", name: "Henrique" },
      screen: { ...screen, local: silence },
    },
    controls: { ...meta.args.controls, mine: { screen: true, camera: false } },
  },
};
