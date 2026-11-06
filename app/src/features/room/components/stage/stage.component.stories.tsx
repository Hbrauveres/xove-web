import type { Meta, StoryObj } from "@storybook/react-vite";
import { useStage } from "../../hooks/use-stage.hook";
import { Stage } from "./stage.component";

const noop = () => undefined;

/** The stage as the room shows it, with nobody live: its pick kept by the room's own hook. */
function EmptyRoom() {
  const stage = useStage([]);
  return (
    <div style={{ "--box-width": "var(--card-width)", "--box-height": "calc(var(--card-width) * 9 / 16)" } as never}>
      <Stage
        sharers={[]}
        stage={stage}
        ambilight={{ on: true, brightness: 0.9 }}
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
  title: "Room/Stage",
  component: EmptyRoom,
} satisfies Meta<typeof EmptyRoom>;

export default meta;

/** Nobody live: the TV on standby, the settings in the corner, who's here under it. */
export const NobodyLive: StoryObj<typeof meta> = {};
