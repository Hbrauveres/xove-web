import { useRef, useState } from "react";
import { useFloating } from "@shared/stores/floating-store";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import type { SoundKind } from "../../types/sound.types";
import { StageViewerMe } from "../stage-viewer-me";
import { StageViewerSound } from "../stage-viewer-sound";
import styles from "./stage-viewer-bar.component.module.css";
import type { StageViewerBarProps } from "./types/stage-viewer-bar.types";

/**
 * The bar over someone else's stream: what I hear from them at the left, me at the right (my mic
 * while I'm live, or Go live), all M 34, beside the fullscreen button. My stream's own controls live
 * only on my stream. With nobody live, only the settings, in the corner.
 */
export function StageViewerBar(props: StageViewerBarProps) {
  const { sound, voice } = props;
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
        {hear("sound", sound)}
        {hear("voice", voice)}
      </div>
      <div className={styles.right}>
        <StageViewerMe {...props} />
      </div>
    </div>
  );
}
