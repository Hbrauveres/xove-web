import styles from "./stage-video-frame.component.module.css";
import type { StageVideoFrameProps } from "./types/stage-video-frame.types";

/** A video in a frame: 16:9, black, rounded, a hairline drawn inside. Also live's cards, the camera's preview. */
export function StageVideoFrame({ children, className, ref }: StageVideoFrameProps) {
  return (
    <span ref={ref} className={[styles.frame, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
