import { IconButton } from "@shared/components/icon-button";
import { Icon } from "@shared/components/icon";
import { Tooltip } from "@shared/components/tooltip";
import { StageSoundButton } from "../../stage-controls/stage-sound-button";
import { StageSoundDrawer } from "../stage-sound-drawer";
import type { SoundKind } from "../../../types/sound.types";
import styles from "./stage-hear-toggles.component.module.css";
import type { StageHearTogglesProps } from "./types/stage-hear-toggles.types";
import { useHearRow } from "./hooks/use-hear-row.hook";
import { hearWords } from "./utils/hear-words.util";

/**
 * A preview's row: that person's voice and screen sound, heard or not by me wherever they are, and a
 * swap between their screen and camera when they share both (on my own preview, the swap alone). A
 * click turns a sound on or off; resting on it opens the slider, one after the buttons, so moving
 * between buttons only changes what it sets and the row never moves under the pointer. A greyed
 * sound opens none.
 */
export function StageHearToggles({ sharer, hearing, onChange, swap, onActive }: StageHearTogglesProps) {
  const { open, timing, drawer, setRoot, show, toggle, setVolume } = useHearRow(hearing, onChange, onActive);
  const whose = sharer.isMe ? "your" : `${sharer.person.name}'s`;

  const button = (kind: SoundKind) => {
    const { what, unavailable, label } = hearWords(sharer, kind, hearing[kind].muted);
    return (
      <StageSoundButton
        kind={kind}
        {...hearing[kind]}
        unavailable={unavailable}
        talking={sharer.speaking}
        label={label}
        tip={what}
        quiet={open !== null}
        active={open === kind}
        // A greyed sound has nothing to set: no slider unrolls for it.
        onPointerEnter={() => !unavailable && timing.rest(() => show(kind))}
        onPointerLeave={() => timing.leave(false)}
        onKeyboardFocus={() => !unavailable && show(kind)}
        onToggle={() => toggle(kind)}
      />
    );
  };

  return (
    <fieldset
      ref={setRoot}
      className={styles.toggles}
      aria-label={sharer.isMe ? "Your stream" : `${sharer.person.name}'s sounds`}
      data-open={open ?? undefined}
      // Moving the mouse away leaves the slider open (4 s idle or a press elsewhere closes it).
      onPointerMove={() => open && timing.touch()}
    >
      <span className={styles.buttons}>
        {/* My own preview: nothing of mine to hear, only the swap. */}
        {!sharer.isMe && button("voice")}
        {!sharer.isMe && button("sound")}
        {swap && (
          <Tooltip text="Swap screen and camera" hidden={open !== null}>
            <IconButton
              variant="round"
              size="m"
              aria-pressed={swap.on}
              aria-label={`Swap ${whose} screen and camera`}
              onClick={swap.onSwap}
            >
              <Icon name="swap" />
            </IconButton>
          </Tooltip>
        )}
      </span>
      <StageSoundDrawer
        open={open !== null}
        hearing={hearing}
        drawer={drawer}
        label={drawer.shown ? `${hearWords(sharer, drawer.shown, false).what} volume` : ""}
        onVolume={setVolume}
      />
    </fieldset>
  );
}
