import type { Meta, StoryObj } from "@storybook/react-vite";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import type { Sharer } from "../../types/room-view.types";
import { StagePlayer } from "./stage-player.component";

const noop = () => undefined;
/** A track that plays nothing: the story shows the controls over the picture. */
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

/** The player, its pick and hearing kept by the room's own hooks. */
function Player({ sharers }: { sharers: Sharer[] }) {
  const stage = useStage(sharers);
  const hearing = useHearing(sharers, stage.big?.person.id ?? null);
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", width: "var(--card-width)" }}>
      <StagePlayer
        sharers={sharers}
        stage={stage}
        hearing={hearing}
        ambilight={{ on: true, brightness: 0.9 }}
        shape={16 / 9}
        video={null}
        onVideo={noop}
        controls={{
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
        }}
      />
    </div>
  );
}

const meta = {
  title: "Room/Stage player",
  component: Player,
  args: { sharers: [] },
} satisfies Meta<typeof Player>;

export default meta;

/** Nobody live: the TV on standby, the settings in the corner. */
export const NobodyLive: StoryObj<typeof meta> = {};
/** Over Bruno's screen: what I hear from him, Go live, fullscreen. */
export const Watching: StoryObj<typeof meta> = { args: { sharers: [bruno] } };
