import { Track, type Room } from "livekit-client";
import type { StreamMode, StreamSettings } from "@core/api/types/api.types";
import { pickScreen } from "@core/devices/screen-picker.service";
import { isDomError } from "./utils/capture.util";
import { screenSound } from "./screen-sound.service";
import { COULDNT } from "./constants/livekit.constants";
import type { RoomContext, ScreenChange } from "./types/livekit.types";
import { contentHintOf, screenPublishOptions } from "./utils/publish-options.util";
import type { SendService } from "./send.service";
import { isLocalAudio } from "./utils/track-kind.util";

/** Picks another window or tab into the screen I'm sending: viewers keep watching the same stream. */
export class ScreenChangeService {
  private readonly ctx: RoomContext;
  private readonly sending: SendService;

  constructor(ctx: RoomContext, sending: SendService) {
    this.ctx = ctx;
    this.sending = sending;
  }

  async changeScreen(prefs: StreamSettings): Promise<ScreenChange | null> {
    const room = this.ctx.room();
    const video = this.sending.sent("screen");
    if (!room || !video) return null;
    const stream = await this.pick();
    if (!stream) return null;
    const [screen] = stream.getVideoTracks();
    const [sound] = stream.getAudioTracks();
    const drop = () => stream.getTracks().forEach((t) => t.stop());
    // No screen, or the share stopped while the picker was open (its own browser bar): nothing
    // to swap into, and the new pick must not keep capturing.
    if (!screen || this.sending.sent("screen") !== video) {
      drop();
      if (!screen) this.ctx.update({ error: COULDNT.change });
      return null;
    }
    let swapped = false;
    try {
      screen.contentHint = contentHintOf(prefs.mode);
      // Not provided by us: LiveKit stops the old capture and watches the new one's end.
      await video.replaceTrack(screen, { userProvidedTrack: false });
      swapped = true;
      await this.sending.applySettings("screen", prefs);
      await this.followSound(room, sound, prefs.mode);
      this.ctx.refreshLocal();
      return { hasSound: sound !== undefined };
    } catch {
      // Before the swap, nothing of the new pick is sent: stop all of it. After, the screen is
      // LiveKit's; only a sound that didn't make it goes.
      if (swapped) sound?.stop();
      else drop();
      this.ctx.update({ error: COULDNT.change });
      this.ctx.refreshLocal();
      return null;
    }
  }

  /** The browser's picker. Closing it keeps the current share, and isn't an error. */
  private async pick(): Promise<MediaStream | null> {
    try {
      this.ctx.update({ error: null });
      return await pickScreen();
    } catch (e) {
      if (!isDomError(e, "NotAllowedError")) this.ctx.update({ error: COULDNT.change });
      return null;
    }
  }

  /** The new pick's sound follows it: swapped in, added, or dropped. Sound isn't a stream: the API sees no change. */
  private async followSound(room: Room, sound: MediaStreamTrack | undefined, mode: StreamMode) {
    const me = room.localParticipant;
    const before = me.getTrackPublication(Track.Source.ScreenShareAudio)?.track;
    const current = isLocalAudio(before) ? before : undefined;
    if (sound && current) await current.replaceTrack(sound, { userProvidedTrack: false });
    else if (sound) {
      await me.publishTrack(screenSound(sound), {
        ...screenPublishOptions(mode),
        source: Track.Source.ScreenShareAudio,
      });
    } else if (current) await me.unpublishTrack(current, true);
  }
}
