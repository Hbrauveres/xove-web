import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import { useSettingsAnchor } from "../../hooks/use-settings-anchor.hook";
import { SETTINGS } from "../../constants/stream-words.constants";
import { StageGoLive } from "../stage-go-live";
import { StageMyMic } from "../stage-my-mic";
import type { ViewerMe } from "../../types/viewer-me.types";

/**
 * Me, over someone else's stream, M 34: my mic while I'm live (red while it's on), or Go live; with
 * nobody live, only the settings.
 */
export function StageViewerMe(props: ViewerMe) {
  const anchor = useSettingsAnchor();
  if (props.settingsOnly)
    return (
      <Tooltip text={SETTINGS}>
        <IconButton ref={anchor?.cog} variant="round" size="m" aria-label={SETTINGS} onClick={props.onSettings}>
          <Icon name="cog" />
        </IconButton>
      </Tooltip>
    );
  if (props.live) return <StageMyMic on={Boolean(props.micOn)} size="m" onClick={props.onMic} />;
  return (
    <StageGoLive
      canShareScreen={props.canShareScreen}
      full={props.full}
      onStart={props.onStart}
      onSettings={props.onSettings}
    />
  );
}
