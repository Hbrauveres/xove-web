import type { Meta, StoryObj } from "@storybook/react-vite";
import { useStage } from "../../hooks/use-stage.hook";
import type { Sharer } from "../../types/room-view.types";
import { Stage } from "./stage.component";

const noop = () => undefined;
/** A track that plays nothing: the story shows the stage round the picture. */
const silence = { attach: (el: HTMLMediaElement) => el, detach: (el: HTMLMediaElement) => el };
const bruno: Sharer = {
  person: { id: "bruno", name: "Bruno", hue: 30, online: true },
  isMe: false,
  since: 0,
  hasSound: true,
  screen: {
    kind: "screen",
    startedAt: 0,
    settings: { quality: "1080p", mode: "sharp" },
    remote: { video: silence, setQuality: noop },
  },
};

/** The stage as the room shows it, its pick kept by the room's own hook. */
function Room({ sharers }: { sharers: Sharer[] }) {
  const stage = useStage(sharers);
  return (
    <div style={{ "--box-width": "var(--card-width)", "--box-height": "calc(var(--card-width) * 9 / 16)" } as never}>
      <Stage
        sharers={sharers}
        stage={stage}
        ambilight={{ on: true, brightness: 0.9 }}
        controls={{
          mine: { screen: false, camera: false },
          places: 6,
          free: 6 - sharers.length,
          cameras: [],
          camera: null,
          canShareScreen: true,
          onStart: noop,
          onStop: noop,
          onChangeWindow: noop,
          onPickCamera: noop,
          settingsOpen: false,
          onSettings: noop,
        }}
      />
    </div>
  );
}

const meta = {
  title: "Room/Stage",
  component: Room,
  args: { sharers: [] },
} satisfies Meta<typeof Room>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nobody live: the TV on standby, the settings in the corner, who's here under it. */
export const NobodyLive: Story = {};
/** Watching Bruno's screen: what I hear from him over it, his name under it. */
export const Watching: Story = { args: { sharers: [bruno] } };
