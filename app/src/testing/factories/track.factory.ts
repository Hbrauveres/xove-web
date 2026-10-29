import type { MediaTrack } from "@services/livekit-service/types/livekit.types";
import { FakeTrack } from "../fakeLiveKit";

/** A fake video or audio track, new on every call: what one test attaches never shows in another. */
export const aTrack = () => new FakeTrack() as unknown as MediaTrack;
