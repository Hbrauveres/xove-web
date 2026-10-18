let picture: HTMLCanvasElement | undefined;

/**
 * The empty stage's viewfinder corners as a small still picture, for the ambilight to light
 * (spec 0123 prototype): dark, with each corner's two arms right on the edge, where the light is
 * read, so each corner glows its own colour (the top right red). Made once; null where the page
 * has no canvas. Lit once, so it costs nothing after.
 */
export function viewfinderPicture(): HTMLCanvasElement | null {
  if (picture) return picture;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, w, h);
  const arm = 18;
  const t = 4;
  const corner = (x: number, y: number, dx: number, dy: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.fillRect(dx > 0 ? x : x - arm, dy > 0 ? y : y - t, arm, t);
    ctx.fillRect(dx > 0 ? x : x - t, dy > 0 ? y : y - arm, t, arm);
  };
  const grey = "#74747a";
  corner(0, 0, 1, 1, grey);
  corner(w, 0, -1, 1, "#ef4b4b");
  corner(0, h, 1, -1, grey);
  corner(w, h, -1, -1, grey);
  return (picture = canvas);
}
