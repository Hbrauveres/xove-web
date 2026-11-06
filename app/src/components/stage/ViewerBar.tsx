import { micState } from "@shared/utils/mic-state.util";
import { ActionPill } from "@shared/components/action-pill";
import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { StreamKind } from "@services/xove-api-service";
import { Slider } from "@shared/components/slider";
import { useSettingsAnchor } from "@features/room/hooks/use-settings-anchor.hook";
import { useHoldOrRest } from "@features/room/hooks/use-hold-or-rest.hook";
import { StageSoundButton } from "@features/room/components/stage-sound-button";
import type { HearSound } from "@features/room/types/sound.types";
import styles from "./ViewerBar.module.css";
import { Tooltip } from "@shared/components/tooltip";
import { MenuRow } from "@shared/components/menu-row";
import { floatingStore, useFloating } from "@shared/stores/floating-store";

type Props = {
  /** What you hear from them, at the left: their screen's sound and their voice. */
  sound?: HearSound;
  voice?: HearSound & { name: string; talking?: boolean };
  /** You, at the right: your mic while you're live, or Go live. */
  live: boolean;
  micOn?: boolean;
  onMic?: () => void;
  canShareScreen: boolean;
  /** Every stream place is taken: why Go live's ways to start are greyed. */
  full?: string;
  onStart: (kind: StreamKind) => void;
  onSettings: () => void;
  /** Only the settings at the right (nobody live). */
  settingsOnly?: boolean;
};

/**
 * The bar over someone else's stream (spec 0123, design decision 1): the left corner is what you hear from
 * them, the right corner is you. Your stream's own controls live only on your stream.
 */
export function ViewerBar(props: Props) {
  const { sound, voice, live, micOn, onMic, canShareScreen, full, onStart, onSettings, settingsOnly } = props;
  const anchor = useSettingsAnchor();
  const [open, setOpen] = useState<"sound" | "voice" | null>(null);
  const [menu, setMenu] = useState(false);
  // Each is one floating thing: the open slider, on a rest; the menu, opened by its button.
  const sounds = useRef<Partial<Record<"sound" | "voice", HTMLElement | null>>>({});
  const openSound = () => (open ? (sounds.current[open] ?? null) : null);
  useFloating({ open: open !== null, kind: "rest", close: () => setOpen(null), area: openSound, anchor: openSound });
  const menuAnchor = useRef<HTMLSpanElement>(null);
  useFloating({
    open: menu,
    kind: "opened",
    close: () => setMenu(false),
    area: () => menuAnchor.current,
    anchor: () => menuAnchor.current,
  });

  return (
    <div ref={anchor?.row} className={styles.bar} data-buttons data-viewer-bar>
      <div className={styles.left}>
        {sound && (
          <Hear
            kind="sound"
            s={sound}
            open={open === "sound"}
            quiet={open !== null}
            setOpen={setOpen}
            anchorRef={(el) => (sounds.current.sound = el)}
          />
        )}
        {voice && (
          <Hear
            kind="voice"
            s={voice}
            open={open === "voice"}
            quiet={open !== null}
            setOpen={setOpen}
            anchorRef={(el) => (sounds.current.voice = el)}
            name={voice.name}
            talking={voice.talking}
          />
        )}
      </div>
      <div className={styles.right}>
        {settingsOnly ? (
          <Tooltip text={"Settings"}>
            <IconButton
              ref={anchor?.cog}
              variant="round"
              size="m"
              className={styles.round}
              aria-label="Settings"
              onClick={onSettings}
            >
              <Icon name="cog" size={20} />
            </IconButton>
          </Tooltip>
        ) : live ? (
          <Tooltip text={micState(Boolean(micOn)).label}>
            <IconButton
              variant="round"
              size="m"
              className={styles.round}
              live={Boolean(micOn)}
              aria-pressed={Boolean(micOn)}
              aria-label={micState(Boolean(micOn)).label}
              onClick={onMic}
            >
              <Icon name={micState(Boolean(micOn)).icon} size={20} />
            </IconButton>
          </Tooltip>
        ) : (
          <span ref={menuAnchor} className={styles.anchor}>
            {/* The settings, opened from its menu, open over it (design decision 5). */}
            <ActionPill
              size="m"
              fill="glass"
              lead="dot"
              ref={anchor?.cog}
              data-settings-anchor
              aria-expanded={menu}
              aria-haspopup="menu"
              onClick={() => setMenu((m) => !m)}
            >
              Go live
            </ActionPill>
            {menu && (
              <div className={styles.menu} role="menu">
                <MenuRow
                  role="menuitem"
                  icon={canShareScreen ? "screen-on" : "screen-off"}
                  label="Share your screen"
                  unavailable={!canShareScreen ? "This browser can't share a screen" : full}
                  onPick={() => {
                    setMenu(false);
                    onStart("screen");
                  }}
                />
                <MenuRow
                  role="menuitem"
                  icon={full ? "camera-off" : "camera-on"}
                  label="Turn on your camera"
                  unavailable={full}
                  onPick={() => {
                    setMenu(false);
                    onStart("camera");
                  }}
                />
                <span className={styles.sep} />
                <MenuRow
                  role="menuitem"
                  icon="cog"
                  label="Settings"
                  onPick={() => {
                    setMenu(false);
                    onSettings();
                  }}
                />
              </div>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

/** One sound: a click mutes it; resting the mouse on it opens its own slider, over it. */
function Hear({
  kind,
  s,
  open,
  quiet,
  setOpen,
  anchorRef,
  name,
  talking,
}: {
  kind: "sound" | "voice";
  s: HearSound;
  open: boolean;
  /** A slider is open, this one or the other: its tooltip keeps quiet. */
  quiet: boolean;
  setOpen: Dispatch<SetStateAction<"sound" | "voice" | null>>;
  anchorRef: (el: HTMLElement | null) => void;
  name?: string;
  talking?: boolean;
}) {
  // Closes this sound's slider only if it's still the open one: moving on to the other sound, its
  // timers must not close the slider just opened there.
  const timing = useHoldOrRest(() => setOpen((now) => (now === kind ? null : now)));
  const show = () => {
    // Never over what the person opened themselves.
    if (s.unavailable || !floatingStore.canRest()) return;
    setOpen(kind);
    timing.touch();
  };
  const tip = kind === "sound" ? "Screen sound" : `${name}'s voice`;
  const what = kind === "sound" ? "the screen's sound" : `${name}'s voice`;
  return (
    <span
      ref={anchorRef}
      className={styles.anchor}
      // A voice I hear never fades with the controls: its speaking cue stays.
      data-stays={(kind === "voice" && !s.unavailable && !s.muted) || undefined}
      onPointerEnter={() => timing.rest(show)}
      onPointerLeave={() => timing.leave(true)}
    >
      <StageSoundButton
        kind={kind}
        muted={s.muted}
        volume={s.volume}
        unavailable={s.unavailable}
        talking={talking}
        label={s.unavailable ?? `${s.muted ? "Unmute" : "Mute"} ${what}`}
        tip={tip}
        quiet={quiet}
        onKeyboardFocus={show}
        onToggle={() => {
          s.onChange({ ...s, muted: !s.muted });
          if (open) timing.touch();
        }}
      />
      {!s.unavailable && (
        <span className={styles.slider} data-open={open || undefined} data-muted={s.muted || undefined} inert={!open}>
          <Slider
            className={styles.range}
            min={0}
            max={1}
            step={0.05}
            aria-label={kind === "sound" ? "Screen sound volume" : `${name}'s voice volume`}
            aria-orientation="vertical"
            value={s.volume}
            onChange={(e) => {
              s.onChange({ volume: Number(e.target.value), muted: false });
              timing.touch();
            }}
          />
        </span>
      )}
    </span>
  );
}
