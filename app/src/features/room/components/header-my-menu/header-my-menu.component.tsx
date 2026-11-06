import { Dropdown } from "@shared/components/dropdown";
import { Face } from "@shared/components/face";
import { MenuRow } from "@shared/components/menu-row";
import { PanelSection } from "@shared/components/panel-section";
import { Slider } from "@shared/components/slider";
import { Switch } from "@shared/components/switch";
import { BRIGHTNESS_MAX, BRIGHTNESS_MIN, BRIGHTNESS_STEP } from "./constants/ambilight-slider.constants";
import { CONNECTION_WORDS } from "./constants/connection-words.constants";
import styles from "./header-my-menu.component.module.css";
import type { HeaderMyMenuProps } from "./types/header-my-menu.types";

/** My menu: my name, role and connection; the ambilight's switch and brightness; Admin for admins; Sign out. */
export function HeaderMyMenu(props: HeaderMyMenuProps) {
  const { open, anchor, onClose, me, isAdmin, connection, ambilight, onAmbilightChange, onSignOut } = props;

  return (
    <Dropdown open={open} label="Account" anchor={anchor} width={260} onClose={onClose}>
      <PanelSection className={styles.me}>
        <div className={styles.who}>
          <Face name={me.name} hue={me.hue} size={40} />
          <div>
            <b>{me.name}</b>
            <small>{isAdmin ? "Admin" : "Member"}</small>
          </div>
        </div>
        <div className={styles.status} data-state={connection}>
          <i aria-hidden="true" />
          {CONNECTION_WORDS[connection]}
        </div>
      </PanelSection>

      <PanelSection className={styles.light}>
        <Switch
          label="Ambilight"
          checked={ambilight.on}
          onToggle={() => onAmbilightChange({ ...ambilight, on: !ambilight.on })}
        />
        <Slider
          className={styles.slider}
          min={BRIGHTNESS_MIN}
          max={BRIGHTNESS_MAX}
          step={BRIGHTNESS_STEP}
          aria-label="Ambilight brightness"
          value={ambilight.brightness}
          disabled={!ambilight.on}
          onChange={(e) => onAmbilightChange({ ...ambilight, brightness: Number(e.target.value) })}
        />
      </PanelSection>

      <PanelSection className={styles.actions}>
        {isAdmin && <MenuRow icon="shield" label="Admin" to="/admin" />}
        <MenuRow icon="sign-out" label="Sign out" onPick={onSignOut} />
      </PanelSection>
    </Dropdown>
  );
}
