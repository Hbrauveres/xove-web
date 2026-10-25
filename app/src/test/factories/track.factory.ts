import type { MediaTrack } from "../../types";
import { FakeTrack } from "../fakeLiveKit";

/** A fake video or audio track, new on every call: what one test attaches never shows in another. */
export const aTrack = () => new FakeTrack() as unknown as MediaTrack;
