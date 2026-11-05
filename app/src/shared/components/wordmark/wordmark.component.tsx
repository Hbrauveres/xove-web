import { useId, useRef } from "react";
import { CAP } from "./constants/mark.constants";
import { useMarkAnimation } from "./hooks/use-mark-animation.hook";
import type { WordmarkProps } from "./types/mark.types";
import { FULL, ICON } from "./constants/marks.constants";
import { boxAttrs, cornerAttrs, dotAttrs, ringAttrs, strokeAttrs, wipeAttrs } from "./utils/mark-attrs.util";

/**
 * Xovê's mark: [XOVE] in a viewfinder, the O a record button and the top-right corner red, or the
 * symbol alone (the O in its corners). Drawn, not typed, so it looks the same everywhere. The text
 * colour paints it; the red comes from the accent. Pointing at the whole word plays its animation
 * once: the word slides left under the still left corners while the right ones close in, the
 * corners settle into the icon, the dot blinks twice, and it all plays back.
 */
export function Wordmark({ variant = "full", height }: WordmarkProps) {
  const full = variant === "full";
  const mark = full ? FULL : ICON;
  // Ids for the clips: a letter's flat tips (the V), and the letters as a whole.
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const play = useMarkAnimation(svg, full ? FULL : null);
  return (
    <svg
      ref={svg}
      onPointerEnter={play}
      aria-label="Xovê"
      {...boxAttrs(mark.viewBox, height)}
      style={{ overflow: "visible" }}
    >
      {full && (
        <defs>
          {FULL.letters.map(
            (l) =>
              l.clip && (
                <clipPath key={l.letter} id={`${id}-${l.letter}`}>
                  <rect x={l.clip.x} y={0} width={l.clip.width} height={CAP} />
                </clipPath>
              ),
          )}
          {/* The letters show only between the corners: the animation narrows this. */}
          <clipPath id={`${id}-wipe`}>
            <rect {...wipeAttrs(FULL.frame)} />
          </clipPath>
        </defs>
      )}
      {mark.corners.map((c) => (
        <g key={c.at} data-side={c.at}>
          <polyline {...cornerAttrs(c)} />
        </g>
      ))}
      {/* The clip stays put; the letters slide under it. */}
      <g clipPath={full ? `url(#${id}-wipe)` : undefined}>
        <g data-letters>
          <circle {...ringAttrs(mark.ring)} />
          <circle {...dotAttrs(mark.dot)} />
          {full &&
            FULL.letters.map((l) => (
              <g key={l.letter} clipPath={l.clip ? `url(#${id}-${l.letter})` : undefined}>
                {l.strokes.map((s, i) => (
                  <polyline key={i} {...strokeAttrs(s)} />
                ))}
              </g>
            ))}
        </g>
      </g>
    </svg>
  );
}
