import { MenuRow } from "@shared/components/menu-row";
import { NO_SCREEN } from "../../constants/stream-words.constants";
import type { StageGoLiveRowsProps } from "./types/stage-go-live-rows.types";

/**
 * Go live's rows: the ways to start (greyed where they can't, saying why), then the settings. In Go
 * live's own menu, and in "…" when Go live has folded into it.
 */
export function StageGoLiveRows({ canShareScreen, full, onStart, onSettings, role, onPicked }: StageGoLiveRowsProps) {
  const pick = (then: () => void) => () => {
    onPicked();
    then();
  };
  return (
    <>
      <MenuRow
        role={role}
        icon={canShareScreen ? "screen-on" : "screen-off"}
        label="Share your screen"
        unavailable={canShareScreen ? full : NO_SCREEN}
        onPick={pick(() => onStart("screen"))}
      />
      <MenuRow
        role={role}
        icon={full ? "camera-off" : "camera-on"}
        label="Turn on your camera"
        unavailable={full}
        onPick={pick(() => onStart("camera"))}
      />
      <hr />
      <MenuRow role={role} icon="cog" label="Settings" onPick={pick(onSettings)} />
    </>
  );
}
