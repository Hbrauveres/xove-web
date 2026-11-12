import { useEffect } from "react";
import { usePlayedTrack } from "../../../hooks/use-played-track.hook";
import { useFillsBox } from "./hooks/use-fills-box.hook";
import styles from "./stage-screen-video.component.module.css";
import type { StageScreenVideoProps } from "./types/stage-screen-video.types";

/** Plays someone's shared screen or camera (and the screen's sound, if they shared it). */
export function StageScreenVideo({ video, sound, label, volume = 1, muted = false, onVideo }: StageScreenVideoProps) {
  const videoRef = usePlayedTrack<HTMLVideoElement>(video);
  // Only this browser's playback: the sharer and other viewers aren't affected.
  const audioRef = usePlayedTrack<HTMLAudioElement>(sound, { volume, muted });
  const fill = useFillsBox(videoRef);

  useEffect(() => {
    if (!onVideo) return;
    onVideo(videoRef.current);
    return () => onVideo(null);
  }, [onVideo, videoRef]);

  return (
    <>
      {/* The player has its own controls: no browser picture-in-picture button over it (Edge adds one). */}
      <video
        ref={videoRef}
        className={styles.video}
        data-fill={fill || undefined}
        aria-label={label}
        autoPlay
        playsInline
        muted
        disablePictureInPicture
      />
      {sound && <audio ref={audioRef} autoPlay />}
    </>
  );
}
