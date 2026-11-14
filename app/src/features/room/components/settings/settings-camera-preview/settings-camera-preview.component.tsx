import { LabelPill } from "@shared/components/label-pill";
import { LiveBadge } from "@shared/components/live-badge";
import { cameraProblemWords } from "./utils/camera-problem.util";
import { StageScreenVideo } from "../../stage/stage-screen-video";
import { StageVideoFrame } from "../../stage/stage-video-frame";
import styles from "./settings-camera-preview.component.module.css";
import type { SettingsCameraPreviewProps } from "./types/settings-camera-preview.types";

/**
 * My camera as it's sent, in the room's video frame: LIVE while it's sent, "Only you see this"
 * while it's only mine. Refused or missing, it says so in the picture's place, and how to allow it.
 */
export function SettingsCameraPreview({ video, live, problem }: SettingsCameraPreviewProps) {
  const words = video ? null : cameraProblemWords(problem);
  if (words) return <output className={styles.problem}>{words}</output>;
  return (
    <StageVideoFrame className={styles.frame}>
      <StageScreenVideo video={video} label="Your camera" />
      {live ? (
        <LiveBadge variant="preview" className={styles.live} />
      ) : (
        <LabelPill className={styles.only}>Only you see this</LabelPill>
      )}
    </StageVideoFrame>
  );
}
