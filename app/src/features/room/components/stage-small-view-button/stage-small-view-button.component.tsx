import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { Tooltip } from "@shared/components/tooltip";
import styles from "./stage-small-view-button.component.module.css";
import type { StageSmallViewButtonProps } from "./types/stage-small-view-button.types";

/**
 * The small view, folded: an M round button in the picture's top-right corner that opens it again
 * where it was. It shows only while the small view is folded, and fades with the other controls;
 * it's there unseen otherwise, so the fold knows where to go.
 */
export function StageSmallViewButton({ fold }: StageSmallViewButtonProps) {
  const { folded, show, setCorner } = fold;
  return (
    <div className={styles.corner} data-shown={folded || undefined} inert={!folded} aria-hidden={!folded || undefined}>
      <Tooltip text="Show the small view">
        <IconButton ref={setCorner} variant="round" size="m" aria-label="Show the small view" onClick={show}>
          <Icon name="pip" />
        </IconButton>
      </Tooltip>
    </div>
  );
}
