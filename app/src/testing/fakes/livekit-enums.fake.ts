/** The names and values `livekit-client` exports that the app reads, as LiveKit has them. */

export const RoomEvent = {
  ConnectionStateChanged: "connectionStateChanged",
  ParticipantConnected: "participantConnected",
  ParticipantDisconnected: "participantDisconnected",
  TrackPublished: "trackPublished",
  TrackUnpublished: "trackUnpublished",
  TrackSubscribed: "trackSubscribed",
  TrackUnsubscribed: "trackUnsubscribed",
  LocalTrackPublished: "localTrackPublished",
  LocalTrackUnpublished: "localTrackUnpublished",
  ActiveSpeakersChanged: "activeSpeakersChanged",
  TrackMuted: "trackMuted",
  TrackUnmuted: "trackUnmuted",
  AudioPlaybackStatusChanged: "audioPlaybackChanged",
} as const;

export const VideoQuality = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const;

/** A simulcast layer, as LiveKit's own class keeps it. */
export class VideoPreset {
  width: number;
  height: number;
  encoding: { maxBitrate: number; maxFramerate?: number };
  constructor(width: number, height: number, maxBitrate: number, maxFramerate?: number) {
    this.width = width;
    this.height = height;
    this.encoding = { maxBitrate, ...(maxFramerate === undefined ? {} : { maxFramerate }) };
  }
}

export const ConnectionState = {
  Disconnected: "disconnected",
  Connecting: "connecting",
  Connected: "connected",
  Reconnecting: "reconnecting",
  SignalReconnecting: "signalReconnecting",
} as const;

export const Track = {
  Kind: { Video: "video", Audio: "audio" },
  Source: {
    Camera: "camera",
    Microphone: "microphone",
    ScreenShare: "screen_share",
    ScreenShareAudio: "screen_share_audio",
    Unknown: "unknown",
  },
} as const;
