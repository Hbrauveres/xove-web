let picture: HTMLCanvasElement | undefined;

/**
 * The empty stage's viewfinder corners as a small still picture, for the ambilight to light
 * (spec 0123 prototype): see-through, with a soft round light at each corner in its own colour
 * (the top right red). See-through so the ambilight spreads nothing dark along the sides, and
 * soft so each colour fades out instead of stepping. Made once; null where the page has no
 * canvas. Lit once, so it costs nothing after.
 */
export function viewfinderPicture(): HTMLCanvasElement | null {
  if (picture) return picture;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width: w, height: h } = canvas;
  const glow = (x: number, y: number, rgb: string, strength: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 34);
    g.addColorStop(0, `rgba(${rgb}, ${strength})`);
    g.addColorStop(0.45, `rgba(${rgb}, ${strength * 0.45})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  glow(0, 0, "138, 150, 172", 0.55);
  glow(w, 0, "239, 75, 75", 0.9);
  glow(0, h, "138, 150, 172", 0.55);
  glow(w, h, "138, 150, 172", 0.55);
  return (picture = canvas);
}
