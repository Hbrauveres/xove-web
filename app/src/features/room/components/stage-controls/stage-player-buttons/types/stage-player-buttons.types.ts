import type { ReactNode } from "react";
import type { StreamControls } from "../../../../types/stream-controls.types";

export type StagePlayerButtonsProps = StreamControls & {
  /** A drop-up's list opened or closed: the player keeps its controls shown while one is open. */
  onMenuChange?: ((open: boolean) => void) | undefined;
  /** After my screen and camera, before the cog: my mic. */
  extra?: ReactNode;
  /** No room to centre the row on the picture: it sits beside the fullscreen button. */
  beside?: boolean | undefined;
  /** L 48, or M 34 on a picture too narrow for L even beside fullscreen. */
  size?: "l" | "m" | undefined;
};
