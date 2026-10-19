import { useEffect, useRef, useState } from "react";
import type { Sharer } from "../../types";
import { Range } from "../ui/Range";
import { showToast } from "../ui/toast";
import { SoundIcon, VoiceIcon, VoiceOffIcon, VolumeOffIcon } from "./icons";
import type { Sound } from "./ViewerBar";
import styles from "./HearToggles.module.css";

/** What I hear from one person (spec 0123): their screen's sound and their voice, each its own mute. */
export type Hearing = { sound: Sound; voice: Sound };

/** As the stage's own sound buttons: a mouse rests 120 ms, a finger holds 500 ms; 4 s idle closes. */
const REST_MS = 120;
const HOLD_MS = 500;
const IDLE_MS = 4000;

type Kind = "sound" | "voice";

/**
 * A preview's buttons (specs 0123 and 0131): that person's voice and screen sound, heard or not by
 * me wherever they are, and a swap between their screen and camera when they share both. A tap
 * turns a sound on or off; resting on it or holding it opens its own slider across the preview.
 * A missing sound is greyed in its place; their voice lights green while they speak.
 * `layout`: over the picture (a big preview), or in the row under a small one.
 */
export function HearToggles({
  sharer,
  hearing,
  onChange,
  layout = "over",
  swap,
  onActive,
}: {
  sharer: Sharer;
  hearing: Hearing;
  onChange: (h: Hearing) => void;
  layout?: "over" | "tray";
  swap?: { on: boolean; onSwap: () => void };
  /** Told while a slider is open, so what holds the row keeps it open (spec 0131). */
  onActive?: (active: boolean) => void;
}) {
  const name = sharer.person.name;
  const noSound = !(sharer.screen && sharer.hasSound) ? "No screen sound" : undefined;
  const noVoice = sharer.hasVoice ? undefined : `${name}'s mic is off`;
  const [open, setOpen] = useState<Kind | null>(null);
  const timers = useRef<number[]>([]);
  const idle = useRef<number | undefined>(undefined);
  const swallow = useRef(false);
  const clear = () => timers.current.splice(0).forEach((t) => window.clearTimeout(t));
  const restart = () => {
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setOpen(null), IDLE_MS);
  };
  useEffect(() => () => [...timers.current, idle.current].forEach((t) => window.clearTimeout(t)), []);
  const tell = useRef(onActive);
  useEffect(() => {
    tell.current = onActive;
  });
  useEffect(() => tell.current?.(open !== null), [open]);
  // A press anywhere else closes the slider.
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  const show = (kind: Kind) => {
    setOpen(kind);
    restart();
  };

  const button = (kind: Kind) => {
    const unavailable = kind === "sound" ? noSound : noVoice;
    const muted = hearing[kind].muted;
    const off = Boolean(unavailable) || muted;
    const what = kind === "sound" ? `${name}'s screen sound` : `${name}'s voice`;
    return (
      <button
        type="button"
        className={styles.toggle}
        data-talking={(kind === "voice" && !off && sharer.speaking) || undefined}
        aria-disabled={unavailable ? true : undefined}
        aria-pressed={unavailable ? undefined : muted}
        aria-label={unavailable ? `${name}: ${unavailable}` : `${muted ? "Unmute" : "Mute"} ${what}`}
        title={unavailable ?? what}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse" || unavailable) return;
          clear();
          timers.current.push(window.setTimeout(() => show(kind), REST_MS));
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") clear();
        }}
        data-active={open === kind || undefined}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" || unavailable) return;
          clear();
          timers.current.push(
            window.setTimeout(() => {
              swallow.current = true;
              show(kind);
            }, HOLD_MS),
          );
        }}
        onPointerUp={clear}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          // The preview's own click opens the stream: a toggle doesn't.
          e.stopPropagation();
          if (swallow.current) {
            swallow.current = false;
            return;
          }
          if (unavailable) return showToast(unavailable, kind === "sound" ? <VolumeOffIcon /> : <VoiceOffIcon />);
          onChange({ ...hearing, [kind]: { ...hearing[kind], muted: !muted } });
          if (open) restart();
        }}
      >
        {kind === "sound" ? off ? <VolumeOffIcon /> : <SoundIcon /> : off ? <VoiceOffIcon /> : <VoiceIcon />}
      </button>
    );
  };

  return (
    <span
      ref={root}
      className={styles.toggles}
      data-layout={layout}
      data-open={open ?? undefined}
      onClick={(e) => e.stopPropagation()}
      // Moving the mouse away leaves the slider open (4 s idle or a press elsewhere closes it).
      onPointerMove={() => open && restart()}
    >
      {open && (
        // The sound's slider, on a line above the buttons, which stay (spec 0131).
        <span className={styles.slider}>
          {open === "sound" ? hearing.sound.muted ? <VolumeOffIcon /> : <SoundIcon /> : hearing.voice.muted ? <VoiceOffIcon /> : <VoiceIcon />}
          <Range
            className={styles.range}
            min={0}
            max={1}
            step={0.05}
            aria-label={open === "sound" ? `${name}'s screen sound volume` : `${name}'s voice volume`}
            value={hearing[open].volume}
            onChange={(e) => {
              onChange({ ...hearing, [open]: { volume: Number(e.target.value), muted: false } });
              restart();
            }}
          />
        </span>
      )}
      <span className={styles.buttons}>
        {button("voice")}
        {button("sound")}
        {swap && (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={swap.on}
            aria-label={`Swap ${name}'s screen and camera`}
            title="Swap screen and camera"
            onClick={(e) => {
              e.stopPropagation();
              swap.onSwap();
            }}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 7h11M12 4l3 3-3 3M16 13H5M8 10l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </span>
    </span>
  );
}
