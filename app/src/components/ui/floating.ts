/**
 * What floats over a control (spec 0133): a tooltip or a drop-up. One at a time, across the whole
 * app: whatever appears closes whatever else is showing, at once, so two never stand together.
 */
let current: (() => void) | null = null;

/** Show something floating: whatever else floats closes first. `close` puts this one away. */
export function claimFloating(close: () => void) {
  if (current && current !== close) current();
  current = close;
}

/** This one went away on its own. */
export function releaseFloating(close: () => void) {
  if (current === close) current = null;
}

/** Close whatever floats, unless it's `keep`: before something opens, without claiming yet. */
export function dismissFloating(keep?: () => void) {
  if (current && current !== keep) {
    const close = current;
    current = null;
    close();
  }
}
