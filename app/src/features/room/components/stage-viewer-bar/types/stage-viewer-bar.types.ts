import type { HearSound } from "../../../types/sound.types";
import type { FoldKey } from "../../../types/fold-key.types";
import type { ViewerMe } from "../../../types/viewer-me.types";

/** What I hear from them, at the left: their screen's sound and their voice; me at the right. */
export type StageViewerBarProps = ViewerMe & {
  sound?: HearSound | undefined;
  voice?: (HearSound & { name: string; talking?: boolean | undefined }) | undefined;
  /** What folded into "…" on a narrow picture, in the order it folded. */
  folded?: readonly FoldKey[] | undefined;
};
