import { useRef, useState } from "react";
import { useFloating } from "@shared/stores/floating-store";
import { useSettingsAnchor } from "../../../hooks/use-settings-anchor.hook";
import type { SoundKind } from "../../../types/sound.types";
import { StageMoreMenu } from "../stage-more-menu";
import { StageUnmute } from "../stage-unmute";
import { StageViewerMe } from "../stage-viewer-me";
import { StageViewerSound } from "../stage-viewer-sound";
import styles from "./stage-viewer-bar.component.module.css";
import type { StageViewerBarProps } from "./types/stage-viewer-bar.types";

/**
 * The bar over someone else's stream: what I hear from them at the left, me at the right (my mic
 * while I'm live, or Go live), all M 34, beside the fullscreen button. My stream's own controls live
 * only on my stream. With nobody live, only the settings, in the corner. On a picture too narrow for
 * the whole bar, what folded sits in "…" at the right. While the browser holds the room's sound back,
 * the unmute pill takes the sounds' place: one or the other.
 */
export function StageViewerBar(props: StageViewerBarProps) {
  const { sound, voice, folded = [] } = props;
  const shows = (key: (typeof folded)[number]) => !folded.includes(key);
  // Me stays unless what I would show folded: Go live, or the settings with nobody live. My mic never folds.
  const me = props.live || shows(props.settingsOnly ? "settings" : "go-live");
  const anchor = useSettingsAnchor();
  const [open, setOpen] = useState<SoundKind | null>(null);
  // The open slider is one floating thing, on a rest.
  const sounds = useRef<Partial<Record<SoundKind, HTMLElement | null>>>({});
  const openSound = () => (open ? (sounds.current[open] ?? null) : null);
  useFloating({ open: open !== null, kind: "rest", close: () => setOpen(null), area: openSound, anchor: openSound });
  const hear = (kind: SoundKind, s: StageViewerBarProps["sound"]) =>
    s && (
      <StageViewerSound
        kind={kind}
        sound={s}
        open={open === kind}
        quiet={open !== null}
        setOpen={setOpen}
        anchorRef={(el) => {
          sounds.current[kind] = el;
        }}
        name={voice?.name}
        talking={voice?.talking}
      />
    );
  return (
    <div ref={anchor?.row} className={styles.bar}>
      <div className={styles.left}>
        {props.held ? (
          <StageUnmute />
        ) : (
          <>
            {shows("sound") && hear("sound", sound)}
            {shows("voice") && hear("voice", voice)}
          </>
        )}
      </div>
      <div className={styles.right}>
        {me && <StageViewerMe {...props} />}
        {folded.length > 0 && (
          <StageMoreMenu
            folded={folded}
            sound={sound}
            voice={voice}
            canShareScreen={props.canShareScreen}
            full={props.full}
            onStart={props.onStart}
            onSettings={props.onSettings}
          />
        )}
      </div>
    </div>
  );
}
