import { micState } from "@shared/utils/mic-state.util";
import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { StreamKind } from "@services/xove-api-service";
import { Range } from "../ui/Range";
import { showToast } from "../ui/toast";
import { FULL_ROOM } from "./PlayerButtons";
import styles from "./ViewerBar.module.css";
import { Tooltip } from "@shared/components/tooltip";
import { floatingStore, useFloating } from "@shared/stores/floating-store";

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
    <div className={styles.bar} data-buttons data-viewer-bar>
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
            <IconButton variant="stage" className={styles.round} aria-label="Settings" onClick={onSettings}>
              <Icon name="cog" size={20} />
            </IconButton>
          </Tooltip>
        ) : live ? (
          <Tooltip text={micState(Boolean(micOn)).label}>
            <IconButton
              variant="stage"
              className={styles.round}
              data-on={micOn || undefined}
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
  const icon = kind === "sound" ? (silent ? "volume-off" : "sound") : silent ? "voice-off" : "voice";
  return (
    <span
      ref={anchorRef}
      className={styles.anchor}
      // A voice I hear never fades with the controls: its speaking cue stays (spec 0131).
      data-stays={(kind === "voice" && !s.unavailable && !s.muted) || undefined}
      onPointerEnter={(e) => {
        window.clearTimeout(leave.current);
        const here = e.currentTarget;
        rest.current = window.setTimeout(() => floatingStore.canRest(here) && show(), REST_MS);
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
        <IconButton
          variant="stage"
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
          <Icon name={icon} size={20} />
        </IconButton>
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
