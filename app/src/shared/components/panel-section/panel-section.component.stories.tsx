import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelSection } from "./panel-section.component";

const meta = {
  title: "Shared/Panel section",
  component: PanelSection,
  args: { children: <span style={{ color: "var(--text)" }}>Nobody is waiting for a seat.</span> },
} satisfies Meta<typeof PanelSection>;

export default meta;

/** One section of glass. */
export const Section: StoryObj<typeof meta> = {};
