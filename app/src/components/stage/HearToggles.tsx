import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import { useEffect, useRef, useState } from "react";
import type { Sharer } from "@features/room/types/room-view.types";
import { Range } from "../ui/Range";
import { showToast } from "../ui/toast";
import type { Sound } from "./ViewerBar";
import { useKeyboardLast } from "@features/room/hooks/use-keyboard-last.hook";
import styles from "./HearToggles.module.css";
import { Tooltip } from "../ui/Tooltip";
import { claimFloating, releaseFloating } from "../ui/floating";

/** What I hear from one person (spec 0123): their screen's sound and their voice, each its own mute. */
export type Hearing = { sound: Sound; voice: Sound };

/** As the stage's own sound buttons: the mouse rests 120 ms to open a slider; 4 s idle closes it. */
const REST_MS = 120;
const IDLE_MS = 4000;

type Kind = "sound" | "voice";

/**
 * A preview's buttons (specs 0123 and 0131): that person's voice and screen sound, heard or not by
 * me wherever they are, and a swap between their screen and camera when they share both (on my own
 * preview, the swap alone). A click turns a sound on or off; resting on it opens the slider, one
 * after the buttons. A missing sound is greyed in its place; their voice lights green while they speak.
 */
export function HearToggles({
  sharer,
  hearing,
  onChange,
  swap,
  onActive,
}: {
  sharer: Sharer;
  hearing: Hearing;
  onChange: (h: Hearing) => void;
  swap?: { on: boolean; onSwap: () => void };
  /** Told while a slider is open, so what holds the row keeps it open (spec 0131). */
  onActive?: (active: boolean) => void;
}) {
  const name = sharer.person.name;
  const noSound = !(sharer.screen && sharer.hasSound) ? "No screen sound" : undefined;
  const noVoice = sharer.hasVoice ? undefined : `${name}'s mic is off`;
  const [open, setOpen] = useState<Kind | null>(null);
  const keyboardLast = useKeyboardLast();
  const timers = useRef<number[]>([]);
  const idle = useRef<number | undefined>(undefined);
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
  // The open slider is one floating thing (spec 0133, #128): a tooltip or a drop-up showing closes
  // it at once, and opening it closes them.
  const drawer = useRef<HTMLSpanElement>(null);
  const [closeSlider] = useState(() => () => setOpen(null));
  useEffect(() => {
    if (open) claimFloating(closeSlider, drawer.current);
    else releaseFloating(closeSlider);
  }, [open, closeSlider]);
  // What the row's slider sets: the open sound, kept while it rolls up so it doesn't change on the
  // way. Switching, the one it replaces shrinks away while the new one grows, each let go when its
  // own animation ends (spec 0131).
  const [shown, setShown] = useState<Kind | null>(null);
  const [leaving, setLeaving] = useState<Kind | null>(null);
  const [entering, setEntering] = useState<Kind | null>(null);
  if (open && open !== shown) {
    if (shown) {
      setLeaving(shown);
      setEntering(open);
    }
    setShown(open);
  }
  const iconOf = (kind: Kind, off: boolean) =>
    kind === "sound" ? (
      off ? (
        <Icon name="volume-off" size={20} />
      ) : (
        <Icon name="sound" size={20} />
      )
    ) : off ? (
      <Icon name="voice-off" size={20} />
    ) : (
      <Icon name="voice" size={20} />
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
    return (
      <Tooltip text={unavailable ?? what} hidden={open !== null}>
        <IconButton
          variant="toggle"
          className={styles.toggle}
          data-talking={(kind === "voice" && !off && sharer.speaking) || undefined}
          aria-disabled={unavailable ? true : undefined}
          aria-pressed={unavailable ? undefined : muted}
          aria-label={unavailable ? `${name}: ${unavailable}` : `${muted ? "Unmute" : "Mute"} ${what}`}
          onPointerEnter={() => {
            if (unavailable) return;
            clear();
            timers.current.push(window.setTimeout(() => show(kind), REST_MS));
          }}
          onPointerLeave={clear}
          data-active={open === kind || undefined}
          // By keyboard, a sound's focus opens its slider, as the stage's own (Enter mutes).
          onFocus={() => {
            if (keyboardLast() && !unavailable) show(kind);
          }}
          onClick={(e) => {
            // The preview's own click opens the stream: a toggle doesn't.
            e.stopPropagation();
            if (unavailable)
              return showToast(
                unavailable,
                kind === "sound" ? <Icon name="volume-off" size={20} /> : <Icon name="voice-off" size={20} />,
              );
            onChange({ ...hearing, [kind]: { ...hearing[kind], muted: !muted } });
            if (open) restart();
          }}
        >
          {iconOf(kind, off)}
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <span
      ref={root}
      className={styles.toggles}
      role="group"
      aria-label={sharer.isMe ? "Your stream" : `${name}'s sounds`}
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
          <Tooltip text={"Swap screen and camera"}>
            <IconButton
              variant="toggle"
              className={styles.toggle}
              aria-pressed={swap.on}
              aria-label={`Swap ${sharer.isMe ? "your" : `${name}'s`} screen and camera`}
              onClick={(e) => {
                e.stopPropagation();
                swap.onSwap();
              }}
            >
              <Icon name="swap" />
            </IconButton>
          </Tooltip>
        )}
      </span>
      {/* In the row: one slider after the buttons, unrolling once; moving between buttons only changes
          what it sets, so the row never moves under the pointer (spec 0131). */}
      <span ref={drawer} className={styles.drawer} data-drawer data-open={open ? true : undefined} inert={!open}>
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
              {iconOf(leaving, hearing[leaving].muted)}
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
              {iconOf(shown, hearing[shown].muted)}
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
    </span>
  );
}
