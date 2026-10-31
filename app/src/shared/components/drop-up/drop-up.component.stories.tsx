import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropUpRow } from "@shared/components/drop-up-row";
import { Icon } from "@shared/components/icon";
import { IconButton } from "@shared/components/icon-button";
import { DropUp } from "./drop-up.component";

const meta = {
  title: "Shared/Drop-up",
  component: DropUp,
  args: {
    label: "Your screen",
    enabled: true,
    trigger: (
      <IconButton variant="player" live aria-label="Stop sharing">
        <Icon name="screen-on" size={20} />
      </IconButton>
    ),
    children: (
      <DropUpRow>
        <span style={{ color: "var(--text)" }}>Your screen</span>
      </DropUpRow>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ paddingTop: "var(--strip-item)", display: "grid", placeItems: "center" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DropUp>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At rest: only its button. */
export const Closed: Story = {};
/** Unrolled over its button. */
export const Open: Story = { args: { open: true } };
