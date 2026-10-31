import { useEffect, useLayoutEffect, useRef } from "react";
import type { Masked, MaskOptions } from "../types/picker.types";
import { isUnderList, listMask } from "../utils/list-mask.util";

/**
 * Over its panel: what's right behind the list is masked away while it's open. Measured when it
 * opens; kept until it has rolled back, so nothing shows through it on the way.
 */
export function useListMask({ root, list, open, drawn, down }: MaskOptions) {
  const masked = useRef<Masked[]>([]);
  const unmask = () => {
    masked.current.forEach((node) => {
      node.style.maskImage = "";
      node.style.removeProperty("-webkit-mask-image");
    });
    masked.current = [];
  };
  useLayoutEffect(() => {
    const el = list.current;
    const self = root.current;
    const host = self?.closest("[data-list-host]");
    if (!open || !down || !el || !host || !self) return;
    unmask();
    const l = el.getBoundingClientRect();
    // Each sibling it overlaps gets a band across its whole width: fine while the list is as
    // wide as its column, as in the settings. An inline mask of the element's own would be lost.
    const walk = (parent: Element) => {
      for (const node of parent.children) {
        if (!(node instanceof HTMLElement || node instanceof SVGElement)) continue;
        if (node.contains(self)) {
          if (node !== self) walk(node);
          continue;
        }
        const box = node.getBoundingClientRect();
        if (!isUnderList(box, l)) continue;
        const mask = listMask(box, l);
        node.style.maskImage = mask;
        node.style.setProperty("-webkit-mask-image", mask);
        masked.current.push(node);
      }
    };
    walk(host);
  }, [open, down, root, list]);
  useEffect(() => {
    if (!drawn) unmask();
  }, [drawn]);
  useEffect(() => unmask, []);
}
