import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { PanelSection } from "@shared/components/panel-section";
import { Dropdown } from "./dropdown.component";

function Open() {
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <div ref={anchor} style={{ position: "relative", height: "var(--strip-item)" }}>
      <Dropdown open label="Here now" anchor={anchor} align="center" onClose={() => undefined}>
        <PanelSection>
          <span style={{ color: "var(--text)" }}>Marina is here</span>
        </PanelSection>
      </Dropdown>
    </div>
  );
}

const meta = { title: "Shared/Dropdown", component: Open } satisfies Meta<typeof Open>;

export default meta;

/** Open: it unrolls from its button. */
export const Unrolled: StoryObj<typeof meta> = {};
