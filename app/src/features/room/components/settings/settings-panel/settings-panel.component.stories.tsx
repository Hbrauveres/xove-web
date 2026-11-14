import type { Meta, StoryObj } from "@storybook/react-vite";
import { DEFAULT_VOICE } from "@services/preferences-service";
import type { RoomSession } from "../../../stores/room-session";
import { RoomSessionContext } from "../../../stores/room-session";
import { SettingsPanel } from "./settings-panel.component";

const noop = () => undefined;

/** The panel as the stage shows it, over a player-sized box. */
function InRoom({ screenTab, sharing }: { screenTab: boolean; sharing: boolean }) {
  const session = {
    settings: {
      open: true,
      onClose: noop,
      screenTab,
      mine: { screen: sharing, camera: false },
      prefs: { screen: { quality: "1080p", mode: "smooth" }, camera: { quality: "720p", mode: "smooth" } },
      onPrefsChange: noop,
      screenSurface: "window",
      onChangeWindow: noop,
      cameras: [{ deviceId: "cam-1", label: "Logitech C920" }],
      cameraId: "cam-1",
      onPickCamera: noop,
      onPreviewCamera: noop,
      voicePrefs: DEFAULT_VOICE,
      onVoicePrefs: noop,
      mics: [{ deviceId: "mic-1", label: "Headset (USB)" }],
    },
  } as unknown as RoomSession;
  return (
    <div
      style={{ position: "relative", width: "var(--card-width)", aspectRatio: "16 / 9", background: "var(--black)" }}
    >
      <RoomSessionContext.Provider value={session}>
        <SettingsPanel />
      </RoomSessionContext.Provider>
    </div>
  );
}

const meta = {
  title: "Room/Settings panel",
  component: InRoom,
  args: { screenTab: true, sharing: true },
} satisfies Meta<typeof InRoom>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open on Screen, my screen shared. */
export const Sharing: Story = {};
/** Open, nothing shared yet. */
export const NotSharing: Story = { args: { sharing: false } };
/** Where a screen can't be shared: Screen greyed, open on Camera. */
export const NoScreen: Story = { args: { screenTab: false, sharing: false } };
