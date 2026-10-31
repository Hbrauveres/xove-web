import { Icon } from "@shared/components/icon";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Cue } from "@shared/components/cue";
import { Tooltip } from "@shared/components/tooltip";
import { useFloating } from "@shared/stores/floating-store";
import { CLOSE_MS, FADE_GAP, FADE_PX } from "./constants/picker.constants";
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
export function Picker<T extends string>({
  label,
  options,
  value,
  onChange,
  opens = "down",
  look = "panel",
  disabled = false,
  open: openFromOutside,
  onOpenChange,
  cue,
  adornment,
}: PickerProps<T>) {
  const [own, setOwn] = useState(false);
  const open = openFromOutside ?? own;
  // Drawn while open, and while it rolls back after.
  const [drawn, setDrawn] = useState(false);
  if (open && !drawn) setDrawn(true);
  useEffect(() => {
    if (open || !drawn) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const gone = window.setTimeout(() => setDrawn(false), reduce ? 0 : CLOSE_MS);
    return () => window.clearTimeout(gone);
  }, [open, drawn]);
  const root = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const chosen = options.find((o) => o.value === value) ?? options[0];
  const others = options.filter((o) => o !== chosen);

  const setOpen = (next: boolean) => (openFromOutside === undefined ? setOwn(next) : onOpenChange?.(next));

  // Tells whoever listens each time it opens or closes, however it happened (its drop-up
  // left, a press outside), and that it's closed when it goes away open.
  const told = useRef(false);
  const tell = useRef(onOpenChange);
  useEffect(() => {
    tell.current = onOpenChange;
  });
  useEffect(() => {
    if (open === told.current) return;
    told.current = open;
    tell.current?.(open);
  }, [open]);
  useEffect(
    () => () => {
      if (told.current) tell.current?.(false);
      told.current = false;
    },
    [],
  );

  const floating = useFloating({
    open,
    kind: "opened",
    close: () => setOpen(false),
    area: () => root.current,
    anchor: () => pill.current,
  });

  const optionsIn = () => [...(root.current?.querySelectorAll<HTMLButtonElement>("[role=radio]") ?? [])];

  // Opened upward: no taller than the room above it, up to whatever clips it (a short
  // stage); the rest scrolls, as always.
  const list = useRef<HTMLDivElement>(null);
  // Unrolls a frame after it's drawn, so the browser has the rolled-up state to move from.
  const [unrolled, setUnrolled] = useState(false);
  if (!open && unrolled) setUnrolled(false);
  useEffect(() => {
    if (!open) return;
    const next = requestAnimationFrame(() => setUnrolled(true));
    return () => cancelAnimationFrame(next);
  }, [open]);
  // Over its panel: what's right behind the list is masked away while it's open, and what's
  // just under it comes back over 30 px, nearly invisible near the list.
  // Measured when it opens; kept until it has rolled back, so nothing shows through it on the way.
  const masked = useRef<HTMLElement[]>([]);
  const unmask = () => {
    masked.current.forEach((node) => {
      node.style.maskImage = "";
      node.style.removeProperty("-webkit-mask-image");
    });
    masked.current = [];
  };
  useLayoutEffect(() => {
    const el = list.current;
    const host = root.current?.closest("[data-list-host]");
    if (!open || opens !== "down" || !el || !host || !root.current) return;
    unmask();
    const l = el.getBoundingClientRect();
    // Each sibling it overlaps gets a band across its whole width: fine while the list is as
    // wide as its column, as in the settings. An inline mask of the element's own would be lost.
    const walk = (parent: Element) =>
      [...parent.children].forEach((child) => {
        const node = child as HTMLElement;
        if (node.contains(root.current)) {
          if (node !== root.current) walk(node);
          return;
        }
        const r = node.getBoundingClientRect();
        if (!(r.right > l.left && r.left < l.right && r.bottom > l.top && r.top < l.bottom + FADE_GAP + FADE_PX))
          return;
        const top = l.top - r.top;
        const bottom = l.bottom - r.top + FADE_GAP;
        const mask = `linear-gradient(to bottom, #000 ${top}px, transparent ${top}px, transparent ${bottom}px, rgba(0, 0, 0, 0.08) ${bottom + FADE_PX * 0.5}px, rgba(0, 0, 0, 0.35) ${bottom + FADE_PX * 0.75}px, #000 ${bottom + FADE_PX}px)`;
        node.style.maskImage = mask;
        node.style.setProperty("-webkit-mask-image", mask);
        masked.current.push(node);
      });
    walk(host);
  }, [open, opens]);
  useEffect(() => {
    if (!drawn) unmask();
  }, [drawn]);
  useEffect(() => unmask, []);
  // What the masks were measured against changes (the window, the list of options): it closes.
  const optionsKey = options.map((o) => o.value).join("|");
  const [wasKey, setWasKey] = useState(optionsKey);
  if (optionsKey !== wasKey) {
    setWasKey(optionsKey);
    if (open) setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", floating.close);
    return () => window.removeEventListener("resize", floating.close);
  }, [open, floating]);
  useLayoutEffect(() => {
    const el = list.current;
    if (!open || opens !== "up" || !el) return;
    let clip: Element | null = root.current?.parentElement ?? null;
    while (clip && getComputedStyle(clip).overflow === "visible" && getComputedStyle(clip).overflowY === "visible")
      clip = clip.parentElement;
    const top = clip ? clip.getBoundingClientRect().top : 0;
    const room = (root.current?.getBoundingClientRect().top ?? 0) - top - 8;
    el.style.maxHeight = room > 0 ? `min(${Math.floor(room)}px, calc(var(--ctl, 38px) * 3.5))` : "";
    // Upward, it opens at the pill's end: the nearest option whole, the half-shown one at the top.
    el.scrollTop = el.scrollHeight;
  }, [open, opens]);

  // The cue's ring reaches over the open list: the list's height, while drawn.
  useLayoutEffect(() => {
    const h = open && list.current ? list.current.offsetHeight : 0;
    root.current?.style.setProperty("--list-h", `${h}px`);
  }, [open, drawn]);

  // Opened by the keyboard: its first option takes the focus once it's drawn.
  const focusFirst = useRef(false);
  useEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    // The option nearest the pill, without scrolling the list away from it.
    const all = optionsIn();
    (opens === "up" ? all[all.length - 1] : all[0])?.focus({
      preventScroll: true,
    });
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    if (!open) {
      setOpen(true);
      focusFirst.current = true;
      return;
    }
    const all = optionsIn();
    const at = all.indexOf(document.activeElement as HTMLButtonElement);
    all[Math.min(all.length - 1, Math.max(0, at + step))]?.focus();
  };

  const pick = (next: T) => {
    setOpen(false);
    onChange(next);
    pill.current?.focus();
  };

  return (
    <div
      ref={root}
      className={styles.picker}
      data-picker
      data-opens={opens}
      data-look={look}
      data-open={drawn || undefined}
      onKeyDown={onKeyDown}
    >
      {/* A long name ends in "…" in the pill; the whole of it in its tooltip. */}
      <Tooltip text={chosen?.label}>
        <button
          ref={pill}
          type="button"
          className={styles.pill}
          aria-label={`${label}: ${chosen?.label ?? ""}`}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <span className={styles.chosen}>{chosen?.label}</span>
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
          [opens === "up" ? "top" : "bottom"]: "calc(-1 * var(--list-h, 0px))",
          transition: "top 220ms cubic-bezier(0.2, 0.8, 0.2, 1), bottom 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
      {drawn && (
        <div
          ref={list}
          id={listId}
          role="radiogroup"
          aria-label={label}
          className={styles.list}
          data-unroll={(open && unrolled) || undefined}
          // Rolling back: still drawn, out of reach.
          aria-hidden={!open || undefined}
          inert={!open || undefined}
        >
          {others.map((o, i) => (
            <Tooltip key={o.value} text={o.label}>
              <button
                type="button"
                role="radio"
                aria-checked="false"
                className={styles.option}
                // The nearest to the pill appears first.
                style={
                  {
                    "--k": opens === "up" ? others.length - 1 - i : i,
                  } as CSSProperties
                }
                onClick={() => pick(o.value)}
              >
                <span className={styles.name}>{o.label}</span>
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}
