import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import type { AmbilightPrefs } from "@services/preferences-service";
import { StageLight } from "./stage-light.component";

/** A stage playing a slowly shifting picture, drawn on a canvas, with its light round it. */
function Lit({ prefs }: { prefs: AmbilightPrefs }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  useEffect(() => {
    const canvas = Object.assign(document.createElement("canvas"), { width: 320, height: 180 });
    const ctx = canvas.getContext("2d");
    const el = Object.assign(document.createElement("video"), { muted: true, srcObject: canvas.captureStream(30) });
    let frame = 0;
    const draw = (t: number) => {
      if (ctx) {
        ctx.fillStyle = `hsl(${(t / 40) % 360} 70% 45%)`;
        ctx.fillRect(0, 0, 160, 180);
        ctx.fillStyle = `hsl(${(t / 40 + 160) % 360} 70% 45%)`;
        ctx.fillRect(160, 0, 160, 180);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    void el.play().then(() => setVideo(el));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div style={{ position: "relative", margin: "var(--space-12)", aspectRatio: "16 / 9", width: "var(--card-width)" }}>
      <StageLight video={video} prefs={prefs} />
    </div>
  );
}

const meta = {
  title: "Room/Stage light",
  component: Lit,
  args: { prefs: { on: true, brightness: 0.9 } },
} satisfies Meta<typeof Lit>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A playing picture's own colours, glowing round the stage. */
export const Glowing: Story = {};
/** Switched off: the light fades out. */
export const Off: Story = { args: { prefs: { on: false, brightness: 0.9 } } };
