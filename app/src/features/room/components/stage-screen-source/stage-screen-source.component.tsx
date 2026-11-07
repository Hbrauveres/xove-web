import { Icon } from "@shared/components/icon";
import { SURFACE } from "./constants/stage-screen-source.constants";
import styles from "./stage-screen-source.component.module.css";
import type { StageScreenSourceProps } from "./types/stage-screen-source.types";

/** What my screen share shows, in words, after a window icon: a window, a tab or the whole screen. */
export function StageScreenSource({ surface }: StageScreenSourceProps) {
  return (
    <span className={styles.source}>
      <Icon name="window" />
      <span>{surface ? SURFACE[surface] : "Your screen"}</span>
    </span>
  );
}
