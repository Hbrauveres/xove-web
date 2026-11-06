import { useRef, useState } from "react";
import { Face } from "@shared/components/face";
import { IconButton } from "@shared/components/icon-button";
import { HeaderMyMenu } from "../header-my-menu";
import styles from "./header-my-picture-button.component.module.css";
import type { HeaderMyPictureButtonProps } from "./types/header-my-picture-button.types";

/** My picture at the header's right, with a dot for the connection. It opens my menu. */
export function HeaderMyPictureButton(props: HeaderMyPictureButtonProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const { me, connection } = props;

  return (
    <div ref={anchor} className={styles.wrap}>
      <IconButton
        variant="header"
        className={styles.button}
        aria-label={`${me.name}: account, ${connection}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Face name={me.name} hue={me.hue} size={32} />
        <i className={styles.dot} data-state={connection} aria-hidden="true" />
      </IconButton>
      <HeaderMyMenu {...props} open={open} anchor={anchor} onClose={() => setOpen(false)} />
    </div>
  );
}
