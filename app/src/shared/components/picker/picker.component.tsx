import { Icon } from "@shared/components/icon";
import { Cue } from "@shared/components/cue";
import { PickerList } from "@shared/components/picker-list";
import { Tooltip } from "@shared/components/tooltip";
import { usePicker } from "./hooks/use-picker.hook";
import styles from "./picker.component.module.css";
import type { PickerProps } from "./types/picker.types";

/**
 * The app's picker: a pill showing the chosen option that grows into one box with the other
 * options, no gap. The chosen option stays in the pill and isn't repeated. Rows are as tall as
 * the pill; after three and a half the list scrolls with the app's slim scrollbar.
 * The list floats: in a panel (the nearest `[data-list-host]`), what's right behind it is
 * hidden while it's open and what's just under it fades back in, so it reads as one box with
 * its pill and nothing moves. It unrolls from the pill and rolls back.
 */
export function Picker<T extends string>(props: PickerProps<T>) {
  const { label, opens = "down", look = "panel", disabled = false, cue, adornment } = props;
  const up = opens === "up";
  const { root, pill, list, listId, open, setOpen, drawn, unrolled, chosen, others, pick } = usePicker(props, up);
  const name = chosen?.label;

  return (
    <div
      ref={root}
      className={styles.picker}
      data-picker
      data-opens={opens}
      data-look={look}
      data-open={drawn || undefined}
    >
      {/* A long name ends in "…" in the pill; the whole of it in its tooltip. */}
      <Tooltip text={name}>
        <button
          ref={pill}
          type="button"
          className={styles.pill}
          aria-label={`${label}: ${name ?? ""}`}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <span className={styles.chosen}>{name}</span>
          {adornment}
          <Icon name="chevron" size={12} className={styles.chevron} />
        </button>
      </Tooltip>
      {/* Over the list, round the pill and the list as one box. */}
      <Cue
        request={cue}
        style={{
          zIndex: 11,
          borderRadius: "var(--pick-r)",
          [up ? "top" : "bottom"]: "calc(-1 * var(--list-h, 0px))",
          transition: "top 220ms cubic-bezier(0.2, 0.8, 0.2, 1), bottom 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
      {drawn && (
        <PickerList
          ref={list}
          id={listId}
          label={label}
          options={others}
          open={open}
          unrolled={unrolled}
          up={up}
          onPick={pick}
        />
      )}
    </div>
  );
}
