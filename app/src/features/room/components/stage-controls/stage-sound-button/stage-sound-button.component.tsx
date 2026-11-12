import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { toastStore } from "@shared/stores/toast-store";
import { useKeyboardLast } from "../../../hooks/use-keyboard-last.hook";
import styles from "./stage-sound-button.component.module.css";
import type { StageSoundButtonProps } from "./types/stage-sound-button.types";
import { soundIcon } from "../../../utils/sound-icon.util";
import { voiceCue } from "./utils/voice-cue.util";

/**
 * One sound I hear from someone, their screen's sound or their voice: a click mutes it, the
 * keyboard's focus opens its slider. Greyed where there's nothing to hear, saying why; their voice
 * lights green while they speak, and fades while they're quiet. Where its slider sits is the
 * caller's.
 */
export function StageSoundButton(props: StageSoundButtonProps) {
  const { kind, muted, volume, unavailable, talking, label, tip, quiet, active, onToggle, onKeyboardFocus, ref } =
    props;
  const keyboardLast = useKeyboardLast();
  const off = Boolean(unavailable) || muted || volume === 0;
  const cue = voiceCue(kind, off, Boolean(talking));
  return (
    <Tooltip text={unavailable ?? tip} hidden={quiet}>
      <IconButton
        ref={ref}
        variant="round"
        size="m"
        className={styles.sound}
        data-cue={cue}
        data-active={active || undefined}
        unavailable={Boolean(unavailable)}
        aria-pressed={unavailable ? undefined : muted}
        aria-label={label}
        onPointerEnter={props.onPointerEnter}
        onPointerLeave={props.onPointerLeave}
        onFocus={() => {
          if (keyboardLast() && !unavailable) onKeyboardFocus?.();
        }}
        onClick={() => {
          if (unavailable) return toastStore.show(unavailable, <Icon name={soundIcon(kind, true)} size={20} />);
          onToggle();
        }}
      >
        <Icon name={soundIcon(kind, off)} />
      </IconButton>
    </Tooltip>
  );
}
