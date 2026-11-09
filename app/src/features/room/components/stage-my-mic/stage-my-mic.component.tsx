import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { micState } from "./utils/mic-state.util";
import type { StageMyMicProps } from "./types/stage-my-mic.types";

/** My mic, round: red while it's on, the talking cue while my voice is sent; says what a click does. */
export function StageMyMic({ on, speaking, size, onClick }: StageMyMicProps) {
  const mic = micState(on);
  return (
    <Tooltip text={mic.label}>
      <IconButton
        variant="round"
        size={size}
        live={on}
        aria-pressed={on}
        aria-label={mic.label}
        data-cue={on && speaking ? "talking" : undefined}
        onClick={onClick}
      >
        <Icon name={mic.icon} />
      </IconButton>
    </Tooltip>
  );
}
