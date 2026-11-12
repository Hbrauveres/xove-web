import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef } from "react";
import { usePreviewTray } from "../../../hooks/use-preview-tray.hook";
import { StagePreviewTray } from "./stage-preview-tray.component";

/** A stand-in preview with its row open under it. */
function Opened() {
  const tray = usePreviewTray();
  const preview = useRef<HTMLDivElement>(null);
  const { show } = tray;
  useEffect(() => {
    if (preview.current) show({ id: "user-2", anchor: preview.current, picture: preview.current });
  }, [show]);
  return (
    <div style={{ padding: "var(--space-6)" }}>
      <div ref={preview} style={{ width: "8rem", aspectRatio: "16 / 9", background: "var(--grey-22-90)" }} />
      <StagePreviewTray tray={tray} render={() => <p style={{ margin: 0, padding: "var(--space-2)" }}>Its row</p>} />
    </div>
  );
}

const meta = { title: "Room/Stage preview tray", component: Opened } satisfies Meta<typeof Opened>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A preview's row, floating under it at its width. */
export const Open: Story = {};
