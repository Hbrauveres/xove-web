import { Icon } from "@shared/components/icon";
import { useRef } from "react";
import type { MediaTrack } from "@services/livekit-service";
import { ScreenVideo } from "./ScreenVideo";
import styles from "./Facecam.module.css";
import { Tooltip } from "@shared/components/tooltip";

/** Where the facecam sits over the player: its top-left corner, as fractions of the player (0 to 1). */
export type FacecamPlace = { x: number; y: number };

type Props = {
  video?: MediaTrack;
  label: string;
  place: FacecamPlace;
  collapsed: boolean;
  /** Puts this video in the big player, and the big one here. */
  onSwap: () => void;
  onMove: (place: FacecamPlace) => void;
  onCollapse: (collapsed: boolean) => void;
};

/** How far an arrow key moves the facecam. */
const STEP = 0.05;

const round = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, max: number) => round(Math.min(Math.max(n, 0), Math.max(max, 0)));

/**
 * The small window over the big player when someone shares their screen and their
 * camera together (spec 0060): their camera over the screen, or the other way round.
 * Drag it (or move it with the arrow keys) wherever it bothers least, collapse it to a
 * tab, or swap it with the big video with its button.
 */
export function Facecam({ video, label, place, collapsed, onSwap, onMove, onCollapse }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; from: FacecamPlace } | null>(null);

  /** The furthest the facecam can go and still be whole inside the player. */
  const limits = () => {
    const box = boxRef.current;
    const player = box?.parentElement?.getBoundingClientRect();
    const own = box?.getBoundingClientRect();
    if (!player || !own || player.width === 0 || player.height === 0) return null;
    return { player, maxX: 1 - own.width / player.width, maxY: 1 - own.height / player.height };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Its buttons are buttons, not handles.
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, from: place };
    boxRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = drag.current;
    const room = limits();
    if (!start || start.pointerId !== e.pointerId || !room) return;
    onMove({
      x: clamp(start.from.x + (e.clientX - start.x) / room.player.width, room.maxX),
      y: clamp(start.from.y + (e.clientY - start.y) / room.player.height, room.maxY),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.pointerId !== e.pointerId) return;
    drag.current = null;
    boxRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== boxRef.current) return;
    const room = limits();
    if (!room) return;
    const moves: Record<string, FacecamPlace> = {
      ArrowLeft: { x: place.x - STEP, y: place.y },
      ArrowRight: { x: place.x + STEP, y: place.y },
      ArrowUp: { x: place.x, y: place.y - STEP },
      ArrowDown: { x: place.x, y: place.y + STEP },
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    onMove({ x: clamp(next.x, room.maxX), y: clamp(next.y, room.maxY) });
  };

  if (collapsed) {
    return (
      <Tooltip text={"Show facecam"}>
        <button type="button" className={styles.tab} onClick={() => onCollapse(false)} aria-label="Show facecam">
          <Icon name="facecam" size={14} />
        </button>
      </Tooltip>
    );
  }

  return (
    <div
      ref={boxRef}
      data-facecam=""
      // Its own drag: the stage's pointer handlers don't see it.
      className={styles.facecam}
      style={{ left: `${place.x * 100}%`, top: `${place.y * 100}%` }}
      tabIndex={0}
      aria-roledescription="facecam"
      aria-label={`${label}: drag or use the arrow keys to move it`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <ScreenVideo video={video} label={label} />
      <div className={styles.controls}>
        <Tooltip text={"Swap views"}>
          <button type="button" className={styles.button} onClick={onSwap} aria-label="Swap views">
            <Icon name="swap" size={16} />
          </button>
        </Tooltip>
        <Tooltip text={"Hide facecam"}>
          <button type="button" className={styles.button} onClick={() => onCollapse(true)} aria-label="Hide facecam">
            <Icon name="minimize" size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
