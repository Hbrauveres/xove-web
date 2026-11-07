import type { Meta, StoryObj } from "@storybook/react-vite";
import { MenuRow } from "@shared/components/menu-row";
import { StageBarMenu } from "./stage-bar-menu.component";

const meta = {
  title: "Room/Stage bar menu",
  component: StageBarMenu,
  args: {
    kind: "menu",
    children: (
      <>
        <MenuRow role="menuitem" icon="screen-on" label="Share your screen" onPick={() => undefined} />
        <hr />
        <MenuRow role="menuitem" icon="cog" label="Settings" onPick={() => undefined} />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "flex-end",
          padding: "10rem var(--space-6) var(--space-6)",
        }}
      >
        <span style={{ position: "relative", width: "var(--control-sm)", height: "var(--control-sm)" }}>
          <Story />
        </span>
      </div>
    ),
  ],
} satisfies Meta<typeof StageBarMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A menu over the stage's bar, above its button, its groups parted by a line. */
export const Menu: Story = {};
/** "…"'s: a named group holding sliders too, centred over its holder. */
export const CentredGroup: Story = {
  args: {
    kind: "group",
    "aria-label": "More controls",
    centred: true,
    children: (
      <>
        <MenuRow icon="cog" label="Settings" onPick={() => undefined} />
        <hr />
        <input type="range" aria-label="Screen sound volume" />
      </>
    ),
  },
};
