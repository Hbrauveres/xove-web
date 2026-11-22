/**
 * Stand-in for the "livekit-client" package in tests (jsdom has no WebRTC): the same names the app
 * imports, and what a test needs to play the room around it.
 */
export * from "./livekit-enums.fake";
export * from "./livekit-devices.fake";
export * from "./livekit-tracks.fake";
export * from "./livekit-participant.fake";
export * from "./livekit-room.fake";
export { rooms, lastRoom, resetFakeLiveKit } from "./livekit-rooms.fake";
