import { useEffect, useRef, useState } from "react";
import type { MediaTrack } from "../../types";
import styles from "./ScreenVideo.module.css";

type Props = {
  video?: MediaTrack;
  /** The screen's sound, when it's someone else's and it plays. */
  sound?: MediaTrack;
  label: string;
  /** 0 to 1. */
  volume?: number;
  muted?: boolean;
  /** Hands out the <video> element, for the ambilight to draw from (spec 0104); null when it goes. */
  onVideo?: (el: HTMLVideoElement | null) => void;
};

/** How close the picture's shape must be to its box's to fill it (spec 0123). */
const SAME_SHAPE = 0.01;

/** Plays someone's shared screen or camera (and the screen's sound, if they shared it). */
export function ScreenVideo({ video, sound, label, volume = 1, muted = false, onVideo }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;
    video.attach(el);
    return () => {
      video.detach(el);
    };
  }, [video]);

  // The stage takes the picture's shape, but in fractional pixels: fitted inside, the picture
  // stops a fraction short of an edge and the black behind shows as a thin line. Where the two
  // shapes are the same (within 1%), it fills the box instead, cropping less than a pixel; real
  // bars (a shape the stage couldn't take) stay.
  const [fill, setFill] = useState(false);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const check = () => {
      const box = el.clientWidth / el.clientHeight;
      const picture = el.videoWidth / el.videoHeight;
      setFill(Number.isFinite(box) && Number.isFinite(picture) && picture > 0 && Math.abs(picture / box - 1) < SAME_SHAPE);
    };
    check();
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    watch?.observe(el);
    el.addEventListener("loadedmetadata", check);
    el.addEventListener("resize", check);
    return () => {
      watch?.disconnect();
      el.removeEventListener("loadedmetadata", check);
      el.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (!onVideo) return;
    onVideo(videoRef.current);
    return () => onVideo(null);
  }, [onVideo]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !sound) return;
    sound.attach(el);
    return () => {
      sound.detach(el);
    };
  }, [sound]);

  // Only this browser's playback: the sharer and other viewers aren't affected.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [volume, muted, sound]);

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
