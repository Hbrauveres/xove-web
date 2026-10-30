import { Switch } from "@shared/components/switch";
import { Face } from "@shared/components/face";
import { IconButton } from "@shared/components/icon-button";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { saveAmbilight } from "@services/preferences-service";
import type { AmbilightPrefs } from "@services/preferences-service";
import type { ConnectionState } from "@services/livekit-service";
import type { Friend } from "@features/room/types/room-view.types";
import { Dropdown, DropdownSection } from "../ui/Dropdown";
import { Range } from "../ui/Range";
import styles from "./AccountButton.module.css";

type Props = {
  me: Friend;
  isAdmin: boolean;
  connection: ConnectionState;
  ambilight: AmbilightPrefs;
  onAmbilightChange: (prefs: AmbilightPrefs) => void;
  onSignOut: () => void;
};

const STATE: Record<ConnectionState, string> = {
  connecting: "Connecting…",
  connected: "Connected",
  reconnecting: "Reconnecting…",
  disconnected: "Video offline",
};

/**
 * My account (spec 0104): my avatar, with a dot for the connection. It opens my name, role and
 * connection; the ambilight's switch and brightness (remembered); Admin for admins; Sign out.
 */
export function AccountButton({ me, isAdmin, connection, ambilight, onAmbilightChange, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const change = (next: AmbilightPrefs) => {
    saveAmbilight(next);
    onAmbilightChange(next);
  };

  return (
    <div ref={anchor} className={styles.wrap}>
      <IconButton
        variant="header"
        ref={button}
        className={styles.button}
        aria-label={`${me.name}: account, ${connection}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Face name={me.name} hue={me.hue} size={32} />
        <i className={styles.dot} data-state={connection} aria-hidden="true" />
      </IconButton>

      <Dropdown
        open={open}
        label="Account"
        anchor={anchor}
        width={260}
        onClose={(returnFocus) => {
          setOpen(false);
          if (returnFocus) button.current?.focus();
        }}
      >
        <DropdownSection className={styles.me}>
          <div className={styles.who}>
            <Face name={me.name} hue={me.hue} size={40} />
            <div>
              <b>{me.name}</b>
              <small>{isAdmin ? "Admin" : "Member"}</small>
            </div>
          </div>
          <div className={styles.status} data-state={connection}>
            <i aria-hidden="true" />
            {STATE[connection]}
          </div>
        </DropdownSection>

        <DropdownSection className={styles.light}>
          <Switch
            label="Ambilight"
            checked={ambilight.on}
            onToggle={() => change({ ...ambilight, on: !ambilight.on })}
          />
          <Range
            className={styles.slider}
            min={0.2}
            max={1}
            step={0.05}
            aria-label="Ambilight brightness"
            value={ambilight.brightness}
            disabled={!ambilight.on}
            onChange={(e) => change({ ...ambilight, brightness: Number(e.target.value) })}
          />
        </DropdownSection>

        <DropdownSection className={styles.actions}>
          {isAdmin && (
            <Link to="/admin" className={styles.item}>
              Admin
            </Link>
          )}
          <button type="button" className={styles.item} onClick={onSignOut}>
            Sign out
          </button>
        </DropdownSection>
      </Dropdown>
    </div>
  );
}
