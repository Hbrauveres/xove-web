/**
 * What floats over a control (spec 0133): a tooltip or a drop-up. One at a time, across the whole
 * app: whatever appears closes whatever else is showing, at once, so two never stand together.
 * What floats inside another (a tooltip on a drop-up's own picker) belongs to it and closes nothing.
 */
let current: { close: () => void; area?: Element | null } | null = null;

/** Show something floating: whatever else floats closes first. `close` puts this one away; `area`
 * is what it covers, so what shows inside it belongs to it. */
export function claimFloating(close: () => void, area?: Element | null) {
  if (current && current.close !== close) current.close();
  current = { close, area };
}

/** This one went away on its own. */
export function releaseFloating(close: () => void) {
  if (current?.close === close) current = null;
}

/** Close whatever floats, unless it's `keep`: before something opens, without claiming yet. */
export function dismissFloating(keep?: () => void) {
  if (current && current.close !== keep) {
    const { close } = current;
    current = null;
    close();
  }
}

/** Whether `node` is inside what floats now: then it belongs to it and mustn't close it. */
export function insideFloating(node: Node | null) {
  return Boolean(node && current?.area?.contains(node));
}
