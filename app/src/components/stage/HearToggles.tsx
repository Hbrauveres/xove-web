import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import { useEffect, useRef, useState } from "react";
import type { Sharer } from "@features/room/types/room-view.types";
import { Slider } from "@shared/components/slider";
import type { Sound } from "./ViewerBar";
import { useHoldOrRest } from "@features/room/hooks/use-hold-or-rest.hook";
import { StageSoundButton } from "@features/room/components/stage-sound-button";
import { soundIcon } from "@features/room/utils/sound-icon.util";
import styles from "./HearToggles.module.css";
import { Tooltip } from "@shared/components/tooltip";
import { useFloating } from "@shared/stores/floating-store";

/** What I hear from one person (spec 0123): their screen's sound and their voice, each its own mute. */
export type Hearing = { sound: Sound; voice: Sound };

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
  const timing = useHoldOrRest(() => setOpen(null));
  const tell = useRef(onActive);
  useEffect(() => {
    tell.current = onActive;
  });
  useEffect(() => tell.current?.(open !== null), [open]);
  // The open slider floats inside its row. No button to go back to: Escape closes the row.
  const root = useRef<HTMLSpanElement>(null);
  useFloating({ open: open !== null, kind: "rest", close: () => setOpen(null), area: () => root.current });
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
  const iconOf = (kind: Kind, off: boolean) => <Icon name={soundIcon(kind, off)} />;
  const show = (kind: Kind) => {
    setOpen(kind);
    timing.touch();
  };

  const button = (kind: Kind) => {
    const what = kind === "sound" ? `${name}'s screen sound` : `${name}'s voice`;
    const { muted, volume } = hearing[kind];
    const unavailable = kind === "sound" ? noSound : noVoice;
    return (
      <StageSoundButton
        kind={kind}
        muted={muted}
        volume={volume}
        unavailable={unavailable}
        talking={sharer.speaking}
        label={unavailable ? `${name}: ${unavailable}` : `${muted ? "Unmute" : "Mute"} ${what}`}
        tip={what}
        quiet={open !== null}
        active={open === kind}
        onPointerEnter={() => timing.rest(() => show(kind))}
        onPointerLeave={() => timing.leave(false)}
        onKeyboardFocus={() => show(kind)}
        onToggle={() => {
          onChange({ ...hearing, [kind]: { ...hearing[kind], muted: !muted } });
          if (open) timing.touch();
        }}
      />
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
      onPointerMove={() => open && timing.touch()}
    >
      <span className={styles.buttons}>
        {/* My own preview: nothing of mine to hear, only the swap (spec 0131). */}
        {!sharer.isMe && button("voice")}
        {!sharer.isMe && button("sound")}
        {swap && (
          <Tooltip text={"Swap screen and camera"} hidden={open !== null}>
            <IconButton
              variant="round"
              size="m"
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
              {iconOf(leaving, hearing[leaving].muted)}
              <Slider
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
              <Slider
                className={styles.range}
                min={0}
                max={1}
                step={0.05}
                aria-label={shown === "sound" ? `${name}'s screen sound volume` : `${name}'s voice volume`}
                value={hearing[shown].volume}
                onChange={(e) => {
                  onChange({ ...hearing, [shown]: { volume: Number(e.target.value), muted: false } });
                  timing.touch();
                }}
              />
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
