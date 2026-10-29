import { LiveKitAdapter } from "@core/livekit/livekit.adapter";
import { lastRoom } from "../fakeLiveKit";

/** A fresh adapter, joined to a fresh fake room. */
export async function connectedAdapter() {
  const adapter = new LiveKitAdapter();
  await adapter.connect("wss://video.test", "token");
  return adapter;
}

/** Captures and sends my screen (with or without sound), as a start does. */
export async function shareScreen(adapter: LiveKitAdapter, withSound: boolean) {
  lastRoom().localParticipant.nextPickerAudio = withSound;
  const capture = await adapter.capture("screen", "smooth");
  if (capture) await adapter.publishCapture(capture, { quality: "1080p", mode: "smooth" });
  return lastRoom().localParticipant;
}

/** Captures and sends my camera. */
export async function cameraOn(adapter: LiveKitAdapter) {
  const capture = await adapter.capture("camera", "smooth");
  if (capture) await adapter.publishCapture(capture, { quality: "720p", mode: "smooth" });
  return lastRoom().localParticipant.camera!.track;
}
