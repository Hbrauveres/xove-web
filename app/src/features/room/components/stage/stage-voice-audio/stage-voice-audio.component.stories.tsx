import type { Meta, StoryObj } from "@storybook/react-vite";
import type { MediaTrack } from "@services/livekit-service";
import { StageVoiceAudio } from "./stage-voice-audio.component";

/** A track with nothing in it: the story shows there's nothing to see. */
const silence: MediaTrack = { attach: (el) => el, detach: (el) => el };

const meta = {
  title: "Room/Stage voice audio",
  component: StageVoiceAudio,
  args: { track: silence, volume: 1, muted: false },
} satisfies Meta<typeof StageVoiceAudio>;

export default meta;

/** Plays a voice; draws nothing. */
export const Voice: StoryObj<typeof meta> = {};
