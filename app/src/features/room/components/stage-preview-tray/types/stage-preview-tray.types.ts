import type { ReactNode } from "react";
import type { PreviewTray } from "../../../types/preview-tray.types";

export interface StagePreviewTrayProps {
  tray: PreviewTray;
  /** One person's row. */
  render: (id: string) => ReactNode;
}
