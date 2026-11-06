import { streamLabel } from "./utils/stream-label.util";
import { useRef } from "react";
import { StageFacecam } from "../stage-facecam";
import { StageNotice } from "../stage-notice";
import { StageScreenVideo } from "../stage-screen-video";
import styles from "./stage-picture.component.module.css";
import type { StagePictureProps } from "./types/stage-picture.types";

/**
 * What plays on the stage: the big stream, or a notice while it's on its way, and the facecam over
 * it. My own stream plays without its sound (it would echo); sharing the whole screen shows the
 * page inside itself, which sharing a tab or a window avoids.
 */
export function StagePicture(props: StagePictureProps) {
  const { big, main, small, sound, facecam, onSwap, onVideo } = props;
  const slide = useRef<HTMLDivElement>(null);
  const label = streamLabel(big, main);
  const name = big.person.name;
  const video = big.isMe ? main.local : main.remote?.video;

  const content = video ? (
    <StageScreenVideo
      video={video}
      label={label}
      {...(big.isMe ? {} : { sound: big.sound, volume: sound.volume, muted: sound.muted })}
      onVideo={onVideo}
    />
  ) : big.isMe ? (
    <StageNotice spinner title="Starting your share…" text="Your screen shows here in a moment." />
  ) : (
    <StageNotice spinner title={`Loading ${name}'s ${main.kind}…`} text="The video starts in a moment." />
  );

  return (
    <div ref={slide} className={styles.slide}>
      {content}
      {small && (
        <StageFacecam
          video={big.isMe ? small.local : small.remote?.video}
          player={slide}
          label={streamLabel(big, small)}
          place={facecam.place}
          collapsed={facecam.collapsed}
          onSwap={onSwap}
          onMove={props.onFacecamMove}
          onCollapse={props.onFacecamCollapse}
        />
      )}
    </div>
  );
}
