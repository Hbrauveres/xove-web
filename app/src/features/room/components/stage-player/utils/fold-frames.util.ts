/**
 * The fold's two frames: the box where it is, then moved and shrunk onto the corner button's box,
 * from its top-left corner. Only `transform`, so it runs on the compositor.
 */
export function foldFrames(box: DOMRect, corner: DOMRect): Keyframe[] {
  const dx = corner.left - box.left;
  const dy = corner.top - box.top;
  const sx = box.width ? corner.width / box.width : 1;
  const sy = box.height ? corner.height / box.height : 1;
  return [
    { transformOrigin: "0 0", transform: "none" },
    { transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
  ];
}
