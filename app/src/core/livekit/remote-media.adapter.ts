import { Track, VideoQuality, type RemoteParticipant, type RemoteTrackPublication } from "livekit-client";
import type { StreamKind } from "@core/api/types/api.types";
import { SHARE_QUALITIES } from "@core/devices/constants/devices.constants";
import { SOURCE } from "./constants/livekit.constants";
import type { ReadVideo, RemoteMedia, RemoteVideo, ViewQuality } from "./types/livekit.types";

/**
 * Reads what someone sends into plain data. The actions on a publication (hear it, pick its
 * quality) are made once per publication, so an unchanged person keeps equal entries.
 */
export class RemoteMediaReader {
  private readonly subscribers = new WeakMap<RemoteTrackPublication, (on: boolean) => void>();
  private readonly qualities = new WeakMap<RemoteTrackPublication, (quality: ViewQuality) => void>();
  private readonly videos = new WeakMap<RemoteTrackPublication, ReadVideo>();

  /** What someone sends, or nothing when they send nothing. */
  read(p: RemoteParticipant): RemoteMedia | undefined {
    const screen = this.videoOf(p, "screen");
    const camera = this.videoOf(p, "camera");
    const sound = this.soundOf(p);
    const voice = this.voiceOf(p);
    const sendsAudio = sound.hasSound || this.publicationOf(p, Track.Source.Microphone) !== undefined;
    if (!screen && !camera && !sendsAudio) return undefined;
    return { ...(screen ? { screen } : {}), ...(camera ? { camera } : {}), ...sound, ...voice };
  }

  /**
   * Someone's screen or camera: the same object for as long as the same video arrives. Its size
   * and layers are read when asked, since LiveKit says nothing when a sharer's picture changes size.
   */
  private videoOf(p: RemoteParticipant, kind: StreamKind): RemoteVideo | undefined {
    const publication = this.publicationOf(p, SOURCE[kind]);
    const track = publication?.track;
    if (!publication || !track) return undefined;
    const known = this.videos.get(publication);
    if (known?.track === track) return known.video;
    const video: RemoteVideo = {
      video: track,
      get height() {
        return publication.dimensions?.height;
      },
      get layers() {
        return publication.trackInfo?.layers?.length || undefined;
      },
      setQuality: this.quality(publication),
    };
    this.videos.set(publication, { track, video });
    return video;
  }

  /** Their screen's sound: whether they share it, the track while it's downloaded, and the switch. */
  private soundOf(p: RemoteParticipant) {
    const sound = this.publicationOf(p, Track.Source.ScreenShareAudio);
    return {
      ...(sound?.track ? { sound: sound.track } : {}),
      hasSound: Boolean(sound),
      setSoundOn: sound ? this.subscribe(sound) : this.noop,
    };
  }

  /** Their voice: on unless they muted it, talking right now or not, and the switch. */
  private voiceOf(p: RemoteParticipant) {
    const voice = this.publicationOf(p, Track.Source.Microphone);
    const hasVoice = voice !== undefined && !voice.isMuted;
    return {
      ...(voice?.track ? { voice: voice.track } : {}),
      hasVoice,
      speaking: hasVoice && p.isSpeaking,
      setVoiceOn: voice ? this.subscribe(voice) : this.noop,
    };
  }

  private subscribe(publication: RemoteTrackPublication) {
    let action = this.subscribers.get(publication);
    if (!action) {
      action = (on) => {
        if (publication.isSubscribed !== on) publication.setSubscribed(on);
      };
      this.subscribers.set(publication, action);
    }
    return action;
  }

  private quality(publication: RemoteTrackPublication) {
    let action = this.qualities.get(publication);
    if (!action) {
      action = (q) => {
        const preset = SHARE_QUALITIES.find((s) => s.id === q);
        // A fixed quality caps what the server sends this viewer; Auto lets adaptive stream
        // pick what fits the player and the connection.
        if (preset) publication.setVideoDimensions({ width: preset.width, height: preset.height });
        else publication.setVideoQuality(VideoQuality.HIGH);
      };
      this.qualities.set(publication, action);
    }
    return action;
  }

  /** Nothing to do: what a publication's action is when there's nothing to act on. */
  private readonly noop = () => {};

  private publicationOf(p: RemoteParticipant, source: Track.Source): RemoteTrackPublication | undefined {
    return p.getTrackPublication(source);
  }
}
