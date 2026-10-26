/** The device's main pointer is a finger: a phone or a tablet. A laptop with a touch screen still
 * answers no, its main pointer being the trackpad or mouse; the window's size plays no part. */
export const HANDHELD_QUERY = "(pointer: coarse)";

/** Whether this is a phone or a tablet, which Xovê doesn't run on yet. */
export function isHandheld(): boolean {
  return window.matchMedia?.(HANDHELD_QUERY).matches ?? false;
}
