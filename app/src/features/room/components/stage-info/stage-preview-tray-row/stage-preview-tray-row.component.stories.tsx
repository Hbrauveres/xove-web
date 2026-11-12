import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import type { OpenRow } from "../../../types/preview-tray.types";
import { StagePreviewTrayRow } from "./stage-preview-tray-row.component";

/** A stand-in preview, its row placed under it once it's there. */
function UnderAPreview() {
  const [open, setOpen] = useState<OpenRow | null>(null);
  const placed = useRef(false);
  return (
    <div style={{ padding: "var(--space-6)" }}>
      <div
        ref={(el) => {
          if (el && !placed.current) {
            placed.current = true;
            setOpen({ id: "user-2", anchor: el, picture: el });
          }
        }}
        style={{ width: "8rem", aspectRatio: "16 / 9", background: "var(--grey-22-90)" }}
      />
      {open && (
        <StagePreviewTrayRow
          layer={{ open, leaving: false }}
          onGone={() => undefined}
          onEnter={() => undefined}
          onLeave={() => undefined}
          onElement={() => undefined}
        >
          <p style={{ margin: 0, padding: "var(--space-2)", background: "var(--panel)" }}>Its row</p>
        </StagePreviewTrayRow>
      )}
    </div>
  );
}

const meta = { title: "Room/Stage preview tray row", component: UnderAPreview } satisfies Meta<typeof UnderAPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Under its preview, at its width. */
export const Under: Story = {};
