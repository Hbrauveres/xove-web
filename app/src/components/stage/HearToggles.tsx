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
  // What the slider sets: the open sound, kept while it rolls up so it doesn't change on the way.
  const [shown, setShown] = useState<Kind | null>(null);
  // The one it replaces shrinks away while the new one grows (spec 0131).
  // Each one is let go when its own animation ends.
  const [leaving, setLeaving] = useState<Kind | null>(null);
  const [entering, setEntering] = useState<Kind | null>(null);
  if (open && open !== shown) {
    if (shown) {
      setLeaving(shown);
      setEntering(open);
    }
    setShown(open);
  }
  const iconOf = (kind: Kind) =>
    kind === "sound" ? (
      hearing.sound.muted ? (
        <VolumeOffIcon />
      ) : (
        <SoundIcon />
      )
    ) : hearing.voice.muted ? (
      <VoiceOffIcon />
    ) : (
      <VoiceIcon />
    );
  const show = (kind: Kind) => {
    setOpen(kind);
    restart();
  };

  const button = (kind: Kind) => {
    const unavailable = kind === "sound" ? noSound : noVoice;
    const muted = hearing[kind].muted;
    const off = Boolean(unavailable) || muted;
    const what = kind === "sound" ? `${name}'s screen sound` : `${name}'s voice`;
    const btn = (
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
    if (layout !== "over") return btn;
    // Over a big picture: its own slider, upright over the button, as the stage's sounds (spec 0131).
    return (
      <span className={styles.anchor}>
        {btn}
        <span
          className={styles.upright}
          data-open={open === kind || undefined}
          data-muted={muted || undefined}
          inert={open !== kind}
        >
          <Range
            className={styles.uprightRange}
            min={0}
            max={1}
            step={0.05}
            aria-orientation="vertical"
            aria-label={kind === "sound" ? `${name}'s screen sound volume` : `${name}'s voice volume`}
            value={hearing[kind].volume}
            onChange={(e) => {
              onChange({ ...hearing, [kind]: { volume: Number(e.target.value), muted: false } });
              restart();
            }}
          />
        </span>
      </span>
    );
  };

  return (
    <span
      ref={root}
      className={styles.toggles}
      role="group"
      aria-label={sharer.isMe ? "Your stream" : `${name}'s sounds`}
      data-layout={layout}
      data-open={open ?? undefined}
      onClick={(e) => e.stopPropagation()}
      // Moving the mouse away leaves the slider open (4 s idle or a press elsewhere closes it).
      onPointerMove={() => open && restart()}
    >
      <span className={styles.buttons}>
        {/* My own preview: nothing of mine to hear, only the swap (spec 0131). */}
        {!sharer.isMe && button("voice")}
        {!sharer.isMe && button("sound")}
        {swap && (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={swap.on}
            aria-label={`Swap ${sharer.isMe ? "your" : `${name}'s`} screen and camera`}
            title="Swap screen and camera"
            onClick={(e) => {
              e.stopPropagation();
              swap.onSwap();
            }}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4 7h11M12 4l3 3-3 3M16 13H5M8 10l-3 3 3 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </span>
      {/* One slider under the buttons, unrolling once; moving between buttons only changes what it
          sets, with a crossfade, so the row never moves under the pointer (spec 0131). */}
      {layout === "tray" && (
        <span className={styles.drawer} data-drawer data-open={open ? true : undefined} inert={!open}>
          <span className={styles.inner}>
            {leaving && leaving !== shown && (
              <span
                key={`out-${leaving}`}
                className={styles.slider}
                data-slider
                data-leaving
                aria-hidden="true"
                onAnimationEnd={(e) => e.animationName.includes("shrink") && setLeaving(null)}
              >
                {iconOf(leaving)}
                <Range
                  className={styles.range}
                  min={0}
                  max={1}
                  step={0.05}
                  value={hearing[leaving].volume}
                  readOnly
                  tabIndex={-1}
                />
              </span>
            )}
            {shown && (
              <span
                key={shown}
                className={styles.slider}
                data-slider
                data-entering={entering === shown || undefined}
                onAnimationEnd={(e) => e.animationName.includes("grow") && setEntering(null)}
              >
                {iconOf(shown)}
                <Range
                  className={styles.range}
                  min={0}
                  max={1}
                  step={0.05}
                  aria-label={shown === "sound" ? `${name}'s screen sound volume` : `${name}'s voice volume`}
                  value={hearing[shown].volume}
                  onChange={(e) => {
                    onChange({ ...hearing, [shown]: { volume: Number(e.target.value), muted: false } });
                    restart();
                  }}
                />
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
