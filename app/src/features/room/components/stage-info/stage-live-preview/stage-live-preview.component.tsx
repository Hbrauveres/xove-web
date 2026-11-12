import { Face } from "@shared/components/face";
import { LabelPill } from "@shared/components/label-pill";
import { hasRow } from "../../../utils/has-row.util";
import { StageScreenVideo } from "../../stage/stage-screen-video";
import { usePreviewRow } from "./hooks/use-preview-row.hook";
import styles from "./stage-live-preview.component.module.css";
import type { StageLivePreviewProps } from "./types/stage-live-preview.types";
import { previewWords } from "./utils/preview-words.util";
import { stackOf } from "./utils/stack.util";

/**
 * One small preview of someone else's stream: a click puts it on the stage. Someone sharing a screen
 * and a camera: the other picture peeks out behind, like a deck. Pointing at it (or the keyboard's
 * focus) opens its row of buttons, and Tab goes into it. My own preview has a row only for its swap.
 */
export function StageLivePreview({ sharer: s, swapped, swapping, talking, tray, onPick }: StageLivePreviewProps) {
  const { both, feed, video, back, backVideo } = stackOf(s, swapped);
  const { item, picture, isOpen, ...on } = usePreviewRow(s.person.id, hasRow(s), tray);
  if (!feed) return null;
  const words = previewWords(s, feed);
  return (
    <li
      ref={item}
      className={styles.item}
      data-stacked={both || undefined}
      data-open={isOpen || undefined}
      data-swapping={swapping || undefined}
      data-talking={talking || undefined}
      onPointerEnter={on.onPointerEnter}
      onPointerLeave={on.onPointerLeave}
    >
      {both && (
        <span className={styles.behind} aria-hidden="true">
          {backVideo && <StageScreenVideo key={back?.kind} video={backVideo} label="" />}
        </span>
      )}
      <button
        type="button"
        className={styles.preview}
        aria-label={words.label}
        onFocus={on.onFocus}
        onBlur={on.onBlur}
        onKeyDown={on.onKeyDown}
        onClick={() => onPick(s.person.id)}
      >
        <span ref={picture} className={styles.video}>
          {video ? (
            <StageScreenVideo video={video} label={words.picture} />
          ) : (
            <span className={styles.loading}>Loading…</span>
          )}
        </span>
        <LabelPill className={styles.chip} lead={<Face name={s.person.name} hue={s.person.hue} size={16} />}>
          {words.pill}
        </LabelPill>
      </button>
    </li>
  );
}
