/** Someone else in the room, and what this browser asks the server for, per track of theirs. */
import { vi } from "vitest";
import type { FakeTrack } from "./livekit-tracks.fake";

/** What a viewer asks the server for, per screen or camera; and whether it downloads a sound. */
export type FakeRemotePublication = {
  track?: FakeTrack | undefined;
  /** A voice its person muted. */
  isMuted?: boolean;
  dimensions?: { width: number; height: number } | undefined;
  trackInfo?: { layers: unknown[] } | undefined;
  setVideoQuality: ReturnType<typeof vi.fn>;
  setVideoDimensions: ReturnType<typeof vi.fn>;
  isSubscribed: boolean;
  setSubscribed: ReturnType<typeof vi.fn>;
};

/** A track someone publishes, downloaded; `height` and `layers` for a picture (16:9, its qualities). */
export function remotePublication(track: FakeTrack | undefined, height?: number, layers?: number) {
  const publication: FakeRemotePublication = {
    track,
    dimensions: height ? { width: Math.round((height * 16) / 9), height } : undefined,
    trackInfo: layers ? { layers: Array.from({ length: layers }, () => ({})) } : undefined,
    setVideoQuality: vi.fn(),
    setVideoDimensions: vi.fn(),
    isSubscribed: true,
    setSubscribed: vi.fn(),
  };
  return publication;
}

export class FakeParticipant {
  readonly tracks = new Map<string, FakeTrack>();
  readonly publications = new Map<string, FakeRemotePublication>();
  readonly identity: string;
  readonly name: string;
  /** LiveKit's own guess at who's speaking: the app doesn't read it (it measures what it hears). */
  isSpeaking = false;

  constructor(identity: string, name: string) {
    this.identity = identity;
    this.name = name;
  }
  getTrackPublication(source: string) {
    const publication = this.publications.get(source);
    if (publication) return publication;
    const track = this.tracks.get(source);
    return track ? { track } : undefined;
  }
}
