import { Icon } from "@shared/components/icon";
import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { StreamKind } from "@services/xove-api-service";
import { Range } from "../ui/Range";
import { showToast } from "../ui/toast";
import { FULL_ROOM } from "./PlayerButtons";
import styles from "./ViewerBar.module.css";
import { Tooltip } from "../ui/Tooltip";
import { claimFloating, releaseFloating } from "../ui/floating";

/** One sound you hear from the person you watch (spec 0123): its volume and mute. */
export type Sound = { volume: number; muted: boolean };
export type HearSound = Sound & { unavailable?: string; onChange: (s: Sound) => void };

/** How long a resting mouse waits before the slider unrolls, as the drop-ups (spec 0107). */
const REST_MS = 120;
/** The slider closes by itself after this long untouched. */
const IDLE_MS = 4000;

type Props = {
  /** What you hear from them, at the left: their screen's sound and their voice. */
  sound?: HearSound;
  voice?: HearSound & { name: string; talking?: boolean };
  /** You, at the right: your mic while you're live, or Go live. */
  live: boolean;
  micOn?: boolean;
  onMic?: () => void;
  canShareScreen: boolean;
  /** All 6 places are taken: Go live's ways to start are greyed, saying why. */
  full?: boolean;
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
  const [open, setOpen] = useState<"sound" | "voice" | null>(null);
  const [menu, setMenu] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  // A press anywhere else closes the slider and the menu.
  useEffect(() => {
    if (!open && !menu) return;
    const outside = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) {
        setOpen(null);
        setMenu(false);
      }
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [open, menu]);
  // An open slider is one floating thing (spec 0133, #128): a tooltip or a drop-up showing closes
  // it at once, and opening it closes them.
  const [closeSlider] = useState(() => () => setOpen(null));
  useEffect(() => {
    if (open) claimFloating(closeSlider);
    else releaseFloating(closeSlider);
  }, [open, closeSlider]);

  return (
    <div ref={bar} className={styles.bar} data-buttons data-viewer-bar>
      <div className={styles.left}>
        {sound && <Hear kind="sound" s={sound} open={open === "sound"} quiet={open !== null} setOpen={setOpen} />}
        {voice && (
          <Hear
            kind="voice"
            s={voice}
            open={open === "voice"}
            quiet={open !== null}
            setOpen={setOpen}
            name={voice.name}
            talking={voice.talking}
          />
        )}
      </div>
      <div className={styles.right}>
        {settingsOnly ? (
          <Tooltip text={"Settings"}>
            <button type="button" className={styles.round} aria-label="Settings" onClick={onSettings}>
              <Icon name="cog" size={20} />
            </button>
          </Tooltip>
        ) : live ? (
          <Tooltip text={micOn ? "Mute your voice" : "Share your voice"}>
            <button
              type="button"
              className={styles.round}
              data-on={micOn || undefined}
              aria-pressed={Boolean(micOn)}
              aria-label={micOn ? "Mute your voice" : "Share your voice"}
              onClick={onMic}
            >
              {micOn ? <Icon name="mic" size={20} /> : <Icon name="mic-off" size={20} />}
            </button>
          </Tooltip>
        ) : (
          <span className={styles.anchor}>
            {/* The settings, opened from its menu, open over it (design decision 5). */}
            <button
              type="button"
              className={styles.golive}
              data-settings-anchor
              aria-expanded={menu}
              aria-haspopup="menu"
              onClick={() => setMenu((m) => !m)}
            >
              <i aria-hidden="true" />
              Go live
            </button>
            {menu && (
              <div className={styles.menu} role="menu">
                <MenuItem
                  icon={canShareScreen ? <Icon name="screen-on" size={20} /> : <Icon name="screen-off" size={20} />}
                  label="Share your screen"
                  unavailable={!canShareScreen ? "This browser can't share a screen" : full ? FULL_ROOM : undefined}
                  onPick={() => {
                    setMenu(false);
                    onStart("screen");
                  }}
                />
                <MenuItem
                  icon={full ? <Icon name="camera-off" size={20} /> : <Icon name="camera-on" size={20} />}
                  label="Turn on your camera"
                  unavailable={full ? FULL_ROOM : undefined}
                  onPick={() => {
                    setMenu(false);
                    onStart("camera");
                  }}
                />
                <span className={styles.sep} />
                <MenuItem
                  icon={<Icon name="cog" size={20} />}
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

function MenuItem({
  icon,
  label,
  unavailable,
  onPick,
}: {
  icon: ReactNode;
  label: string;
  unavailable?: string;
  onPick: () => void;
}) {
  return (
    <Tooltip text={unavailable}>
      <button
        type="button"
        role="menuitem"
        aria-disabled={unavailable ? true : undefined}
        onClick={() => (unavailable ? showToast(unavailable, icon) : onPick())}
      >
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}

/** One sound: a click mutes it; resting the mouse on it opens its own slider. */
function Hear({
  kind,
  s,
  open,
  quiet,
  setOpen,
  name,
  talking,
}: {
  kind: "sound" | "voice";
  s: HearSound;
  open: boolean;
  /** A slider is open, this one or the other: its tooltip keeps quiet. */
  quiet: boolean;
  setOpen: Dispatch<SetStateAction<"sound" | "voice" | null>>;
  name?: string;
  talking?: boolean;
}) {
  const rest = useRef<number | undefined>(undefined);
  const leave = useRef<number | undefined>(undefined);
  const idle = useRef<number | undefined>(undefined);
  // Closes this sound's slider only if it's still the open one: moving on to the other sound, its
  // timers must not close the slider just opened there (spec 0133).
  const closeMine = () => setOpen((now) => (now === kind ? null : now));
  const restart = () => {
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(closeMine, IDLE_MS);
  };
  const show = () => {
    if (s.unavailable) return;
    setOpen(kind);
    restart();
  };
  useEffect(() => () => [rest, leave, idle].forEach((t) => window.clearTimeout(t.current)), []);

  const silent = Boolean(s.unavailable) || s.muted || s.volume === 0;
  const label =
    s.unavailable ??
    (kind === "sound"
      ? `${s.muted ? "Unmute" : "Mute"} the screen's sound`
      : `${s.muted ? "Unmute" : "Mute"} ${name}'s voice`);
  const icon =
    kind === "sound" ? (
      silent ? (
        <Icon name="volume-off" size={20} />
      ) : (
        <Icon name="sound" size={20} />
      )
    ) : silent ? (
      <Icon name="voice-off" size={20} />
    ) : (
      <Icon name="voice" size={20} />
    );
  return (
    <span
      className={styles.anchor}
      // A voice I hear never fades with the controls: its speaking cue stays (spec 0131).
      data-stays={(kind === "voice" && !s.unavailable && !s.muted) || undefined}
      onPointerEnter={() => {
        window.clearTimeout(leave.current);
        rest.current = window.setTimeout(show, REST_MS);
      }}
      onPointerLeave={() => {
        window.clearTimeout(rest.current);
        leave.current = window.setTimeout(closeMine, 300);
      }}
    >
      <Tooltip
        text={kind === "sound" ? (s.unavailable ?? "Screen sound") : (s.unavailable ?? `${name}'s voice`)}
        hidden={quiet}
      >
        <button
          type="button"
          className={styles.round}
          data-voice={kind === "voice" || undefined}
          data-talking={(kind === "voice" && talking && !silent) || undefined}
          data-silent={(kind === "voice" && !talking && !silent) || undefined}
          aria-disabled={s.unavailable ? true : undefined}
          aria-pressed={s.unavailable ? undefined : s.muted}
          aria-label={label}
          onFocus={(e) => {
            try {
              if (e.currentTarget.matches(":focus-visible")) show();
            } catch {
              /* old browsers */
            }
          }}
          onClick={() => {
            // Unavailable: its tooltip says why.
            if (s.unavailable) return;
            s.onChange({ ...s, muted: !s.muted });
            if (open) restart();
          }}
        >
          {icon}
        </button>
      </Tooltip>
      {!s.unavailable && (
        <span className={styles.slider} data-open={open || undefined} data-muted={s.muted || undefined} inert={!open}>
          <Range
            className={styles.range}
            min={0}
            max={1}
            step={0.05}
            aria-label={kind === "sound" ? "Screen sound volume" : `${name}'s voice volume`}
            aria-orientation="vertical"
            value={s.volume}
            onChange={(e) => {
              s.onChange({ volume: Number(e.target.value), muted: false });
              restart();
            }}
          />
        </span>
      )}
    </span>
  );
}
