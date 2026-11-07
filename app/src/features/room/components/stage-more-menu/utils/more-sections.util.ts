import type { FoldKey } from "../../../types/fold-key.types";
import type { MoreSections } from "../types/more-sections.types";

/**
 * What "…" shows for what folded: the settings (with nobody live), Go live's rows, the sounds, and a
 * line between what starts or sets up and what I hear, when both are there.
 */
export function moreSections(folded: readonly FoldKey[]): MoreSections {
  const has = (key: FoldKey) => folded.includes(key);
  const holdsSettings = has("settings") || has("go-live");
  const sounds = has("sound") || has("voice");
  return {
    settings: has("settings"),
    goLive: has("go-live"),
    sound: has("sound"),
    voice: has("voice"),
    line: holdsSettings && sounds,
    holdsSettings,
  };
}
