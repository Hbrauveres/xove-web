import type { HearSound } from "../../../types/sound.types";
import type { ViewerMe } from "../../../types/viewer-me.types";

/** What I hear from them, at the left: their screen's sound and their voice; me at the right. */
export type StageViewerBarProps = ViewerMe & {
  sound?: HearSound | undefined;
  voice?: (HearSound & { name: string; talking?: boolean | undefined }) | undefined;
};
