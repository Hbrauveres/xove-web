import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelSection } from "@shared/components/panel-section";
import { Panel } from "./panel.component";

const meta = {
  title: "Shared/Panel",
  component: Panel,
  args: {
    children: (
      <div style={{ padding: "var(--space-6)", color: "var(--text)" }}>
        <p style={{ margin: 0 }}>The room is full</p>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>You're number 2 in line.</p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: "var(--card-width)", padding: "var(--space-6)", background: "var(--ground)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One box of glass. */
export const Box: Story = {};
/** Sections with cuts, as in a menu. */
export const Cuts: Story = {
  args: {
    cuts: true,
    children: [
      <PanelSection key="a">
        <p style={{ margin: 0, padding: "var(--space-3)", color: "var(--text)" }}>Activity</p>
      </PanelSection>,
      <PanelSection key="b">
        <p style={{ margin: 0, padding: "var(--space-3)", color: "var(--text-muted)" }}>Rafa joined</p>
      </PanelSection>,
    ],
  },
};
