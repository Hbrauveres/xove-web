import { TABBABLE } from "../constants/preview-tray.constants";

/** What Tab stops at inside `root`, in order: nothing inert, nothing disabled. */
export const tabbables = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => !el.closest("[inert]") && !(el instanceof HTMLButtonElement && el.disabled),
  );

/** The first thing Tab stops at after `after` in the page, past everything inside `skip`. */
export const tabbableAfter = (after: HTMLElement, skip: HTMLElement) =>
  tabbables(document).find(
    (el) =>
      !after.contains(el) &&
      !skip.contains(el) &&
      Boolean(after.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
  );
