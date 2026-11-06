import type { Meta, StoryObj } from "@storybook/react-vite";
import { useHearing } from "../../hooks/use-hearing.hook";
import { useStage } from "../../hooks/use-stage.hook";
import { StagePlayer } from "./stage-player.component";

const noop = () => undefined;

/** The player with nobody live: the TV on standby, the settings in the corner. */
function Standby() {
  const stage = useStage([]);
  const hearing = useHearing([], null);
  return (
    <div style={{ position: "relative", aspectRatio: "16 / 9", width: "var(--card-width)" }}>
      <StagePlayer
        sharers={[]}
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
  component: Standby,
} satisfies Meta<typeof Standby>;

export default meta;

export const NobodyLive: StoryObj<typeof meta> = {};
