import { useRef } from "react";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { StageScreenVideo } from "../stage-screen-video";
import { useFacecamMove } from "./hooks/use-facecam-move.hook";
import styles from "./stage-facecam.component.module.css";
import type { StageFacecamProps } from "./types/stage-facecam.types";
import { placeStyle } from "./utils/place-style.util";

/**
 * The small window over the big player when someone shares their screen and their camera
 * together: their camera over the screen, or the other way round. Drag it (or move it with the
 * arrow keys) wherever it bothers least, collapse it to a tab, or swap it with the big video.
 */
export function StageFacecam({ video, label, place, collapsed, onSwap, onMove, onCollapse }: StageFacecamProps) {
  const box = useRef<HTMLDivElement>(null);
  const buttons = useRef<HTMLDivElement>(null);
  const move = useFacecamMove(box, buttons, place, onMove);

  if (collapsed) {
    return (
      <Tooltip text="Show facecam">
        <button type="button" className={styles.tab} onClick={() => onCollapse(false)} aria-label="Show facecam">
          <Icon name="facecam" size={14} />
        </button>
      </Tooltip>
    );
  }

  return (
    <div
      ref={box}
      className={styles.facecam}
      style={placeStyle(place)}
      role="application"
      tabIndex={0}
      aria-roledescription="facecam"
      aria-label={`${label}: drag or use the arrow keys to move it`}
      {...move}
    >
      <StageScreenVideo video={video} label={label} />
      <div ref={buttons} className={styles.controls}>
        <Tooltip text="Swap views">
          <IconButton variant="mini" onClick={onSwap} aria-label="Swap views">
            <Icon name="swap" size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip text="Hide facecam">
          <IconButton variant="mini" onClick={() => onCollapse(true)} aria-label="Hide facecam">
            <Icon name="minimize" size={16} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
