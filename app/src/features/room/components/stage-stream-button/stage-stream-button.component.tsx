import { DropUp } from "@shared/components/drop-up";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { StageStreamQuick } from "../stage-stream-quick";
import { useStreamUp } from "./hooks/use-stream-up.hook";
import { LABEL, UP_WIDTH } from "./constants/stage-stream-button.constants";
import styles from "./stage-stream-button.component.module.css";
import type { StageStreamButtonProps } from "./types/stage-stream-button.types";
import { streamIcon } from "./utils/stream-icon.util";
import { streamState } from "./utils/stream-state.util";

/**
 * One of my streams' buttons, L 48: a click starts or stops it; greyed (not hidden) where it can't
 * start, saying why. While it's live, resting on it unrolls its quick access; with the settings open,
 * that gesture goes to its setting there instead.
 */
export function StageStreamButton(props: StageStreamButtonProps) {
  const { kind, cameras, busy = false, onStart, onStop, onMenuChange, settingsOpen, onGoTo, size = "l" } = props;
  const { live, unavailable, blocked, label, tip } = streamState(kind, props);
  const icon = streamIcon(kind, live);
  const up = useStreamUp(onMenuChange);
  const button = (
    <div className={styles.control}>
      {/* A live button's drop-up takes its tooltip's place. */}
      <Tooltip text={tip} hidden={live}>
        <IconButton
          variant="round"
          size={size}
          live={live}
          unavailable={unavailable}
          aria-label={label}
          aria-pressed={live}
          aria-disabled={blocked || undefined}
          onClick={() => !blocked && (live ? onStop(kind) : onStart(kind))}
        >
          <span className={styles.iconRest}>
            <Icon name={icon.rest} />
          </span>
          {icon.hover && (
            <span className={styles.iconHover}>
              <Icon name={icon.hover} />
            </span>
          )}
        </IconButton>
      </Tooltip>
    </div>
  );
  return (
    <DropUp
      label={LABEL[kind].quick}
      enabled={live && (kind === "screen" || cameras.length > 0)}
      width={UP_WIDTH[kind]}
      open={up.upOpen}
      onOpenChange={up.onUpOpen}
      redirect={settingsOpen && onGoTo ? () => onGoTo(kind) : undefined}
      trigger={button}
    >
      <StageStreamQuick
        kind={kind}
        screenSurface={props.screenSurface}
        cameras={cameras}
        camera={props.camera}
        busy={busy}
        listOpen={up.listOpen}
        onListOpen={up.onListOpen}
        onChangeWindow={up.done(props.onChangeWindow)}
        onPickCamera={up.done(props.onPickCamera)}
      />
    </DropUp>
  );
}
