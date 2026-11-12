import type { FoldKey } from "../../../../types/fold-key.types";
import type { HearSound } from "../../../../types/sound.types";
import type { GoLiveActions } from "../../../../types/go-live.types";

export type StageMoreMenuProps = GoLiveActions & {
  /** The buttons folded into it, in the order they folded. */
  folded: readonly FoldKey[];
  /** Their screen's sound and their voice, for the rows of those folded. */
  sound?: HearSound | undefined;
  voice?: (HearSound & { name: string }) | undefined;
};
