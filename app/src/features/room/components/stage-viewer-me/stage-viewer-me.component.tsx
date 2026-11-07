import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import { SETTINGS } from "../../constants/stream-words.constants";
import { micState } from "../../utils/mic-state.util";
import { StageGoLive } from "../stage-go-live";
import type { ViewerMe } from "../../types/viewer-me.types";

/**
 * Me, over someone else's stream, M 34: my mic while I'm live (red while it's on), or Go live; with
 * nobody live, only the settings.
 */
export function StageViewerMe(props: ViewerMe) {
  const anchor = useSettingsAnchor();
  const on = Boolean(props.micOn);
  const mic = micState(on);
  if (props.settingsOnly)
    return (
      <Tooltip text={SETTINGS}>
        <IconButton ref={anchor?.cog} variant="round" size="m" aria-label={SETTINGS} onClick={props.onSettings}>
          <Icon name="cog" />
        </IconButton>
      </Tooltip>
    );
  if (props.live)
    return (
      <Tooltip text={mic.label}>
        <IconButton variant="round" size="m" live={on} aria-pressed={on} aria-label={mic.label} onClick={props.onMic}>
          <Icon name={mic.icon} />
        </IconButton>
      </Tooltip>
    );
  return (
    <StageGoLive
      canShareScreen={props.canShareScreen}
      full={props.full}
      onStart={props.onStart}
      onSettings={props.onSettings}
    />
  );
}
