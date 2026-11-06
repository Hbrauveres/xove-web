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
 * The small view: the small window over the big player when someone shares their screen and their
 * camera together, their camera over the screen or the other way round. Drag it (or move it with the
 * arrow keys) wherever it bothers least, swap it with the big video, or hide it: it folds into the
 * corner button, which opens it again.
 */
export function StageFacecam({ video, player, label, place, fold, onSwap, onMove }: StageFacecamProps) {
  const box = useRef<HTMLDivElement>(null);
  const buttons = useRef<HTMLDivElement>(null);
  const move = useFacecamMove({ box, buttons, player, place, onMove });
  const { setBox, setHide, hide } = fold;

  return (
    <div
      ref={(el) => {
        box.current = el;
        setBox(el);
      }}
      className={styles.facecam}
      style={placeStyle(place)}
      role="application"
      tabIndex={0}
      aria-roledescription="small view"
      aria-label={`${label}: drag or use the arrow keys to move it`}
      {...move}
    >
      <StageScreenVideo video={video} label={label} />
      <div ref={buttons} className={styles.controls}>
        <Tooltip text="Swap views">
          <IconButton variant="round" size="m" onClick={onSwap} aria-label="Swap views">
            <Icon name="swap" />
          </IconButton>
        </Tooltip>
        <Tooltip text="Hide the small view">
          <IconButton ref={setHide} variant="round" size="m" onClick={hide} aria-label="Hide the small view">
            <Icon name="minimize" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
