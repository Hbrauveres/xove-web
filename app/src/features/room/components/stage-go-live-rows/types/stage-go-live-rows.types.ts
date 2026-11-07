import type { AriaRole } from "react";
import type { StageGoLiveProps } from "../../stage-go-live/types/stage-go-live.types";

export type StageGoLiveRowsProps = StageGoLiveProps & {
  /** `menuitem` in Go live's menu; none in the "…" menu, which also holds sliders. */
  role?: AriaRole | undefined;
  /** A row was picked: the menu holding them closes. */
  onPicked: () => void;
};
