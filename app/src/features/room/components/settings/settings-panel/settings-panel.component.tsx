import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Panel } from "@shared/components/panel";
import { useRoomSession } from "../../../stores/room-session";
import { SettingsTabs } from "../settings-tabs";
import { CLOSE_ICON_SIZE } from "./constants/settings-panel.constants";
import { useCameraPreviewSwitch } from "./hooks/use-camera-preview-switch.hook";
import { useChosenTab } from "./hooks/use-chosen-tab.hook";
import { usePanelFocus } from "./hooks/use-panel-focus.hook";
import { usePanelPresence } from "./hooks/use-panel-presence.hook";
import { useSettingsCue } from "./hooks/use-settings-cue.hook";
import { usableTabs } from "./utils/usable-tabs.util";
import styles from "./settings-panel.component.module.css";

/**
 * The settings for what I send, over the cog: a title, its ✕, and the tabs. Changes apply at once
 * and are remembered. A non-modal dialog: the stage stays usable beside it.
 */
export function SettingsPanel() {
  const s = useRoomSession().settings;
  const usable = usableTabs(s);
  const { tab, choose } = useChosenTab(s.goTo, usable);
  const cue = useSettingsCue(s.cue, s.open, usable, s.onCueEnd);
  const { present, shown } = usePanelPresence(s.open);
  useCameraPreviewSwitch(s.open && tab === "camera" && !s.mine.camera, s.onPreviewCamera);
  const focus = usePanelFocus(s.open);
  if (!present) return null;
  return (
    <Panel
      as="dialog"
      className={styles.panel}
      aria-label="Settings"
      data-open={shown || undefined}
      inert={!s.open || undefined}
      onKeyDown={(e) => {
        // A non-modal dialog doesn't close on Escape by itself.
        if (e.key !== "Escape") return;
        e.stopPropagation();
        s.onClose();
      }}
      {...focus}
    >
      <div className={styles.head}>
        <h2>Settings</h2>
        <IconButton variant="close" aria-label="Close settings" onClick={s.onClose}>
          <Icon name="close" size={CLOSE_ICON_SIZE} />
        </IconButton>
      </div>
      <SettingsTabs settings={s} usable={usable} chosen={tab} onChoose={choose} cue={cue} />
    </Panel>
  );
}
