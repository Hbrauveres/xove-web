import { useStopping } from "./hooks/use-stopping.hook";
import { startingNotice } from "./utils/starting-notice.util";
import { streamLabel } from "./utils/stream-label.util";
import { useRef } from "react";
import { StageFacecam } from "../stage-facecam";
import { StageNotice } from "../stage-notice";
import { StageScreenVideo } from "../stage-screen-video";
import styles from "./stage-picture.component.module.css";
import type { StagePictureProps } from "./types/stage-picture.types";

/**
 * What plays on the stage: the big stream, or a notice while it starts (never once its video has
 * played: a stream that's stopping leaves the stage straight to what comes next), and the small view
 * over it. My own stream plays without its sound (it would echo); sharing the whole screen shows the
 * page inside itself, which sharing a tab or a window avoids.
 */
export function StagePicture(props: StagePictureProps) {
  const { big, main, small, sound, facecamPlace, fold, onSwap, onVideo } = props;
  const slide = useRef<HTMLDivElement>(null);
  const label = streamLabel(big, main);
  const video = big.isMe ? main.local : main.remote?.video;
  const key = `${big.person.id}:${main.kind}`;
  const stopping = useStopping(key, Boolean(video));

  const content = video ? (
    <StageScreenVideo
      video={video}
      label={label}
      {...(big.isMe ? {} : { sound: big.sound, volume: sound.volume, muted: sound.muted })}
      onVideo={onVideo}
    />
  ) : stopping ? null : (
    <StageNotice spinner {...startingNotice(big.isMe, big.person.name, main.kind)} />
  );

  return (
    <div ref={slide} className={styles.slide}>
      {content}
      {small && !fold.folded && (
        <StageFacecam
          video={big.isMe ? small.local : small.remote?.video}
          player={slide}
          label={streamLabel(big, small)}
          place={facecamPlace}
          fold={fold}
          onSwap={onSwap}
          onMove={props.onFacecamMove}
        />
      )}
    </div>
  );
}
