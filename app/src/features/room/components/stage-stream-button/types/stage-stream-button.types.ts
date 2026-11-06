import type { StreamKind } from "@services/xove-api-service";
import type { IconName } from "@shared/types/icon.types";
import type { StreamControls } from "../../../types/stream-controls.types";

export type StageStreamButtonProps = StreamControls & {
  kind: StreamKind;
  /** A drop-up's list opened or closed: the player keeps its controls shown while one is open. */
  onMenuChange?: ((open: boolean) => void) | undefined;
};

/** A stream button's icon: at rest, and where it differs, while pointed at or focused. */
export type StreamIcon = { rest: IconName; hover?: IconName };
