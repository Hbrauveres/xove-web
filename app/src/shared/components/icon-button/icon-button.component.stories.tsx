import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@shared/components/icon";
import { IconButton } from "./icon-button.component";

const meta = {
  title: "Shared/Icon button",
  component: IconButton,
  args: { variant: "stage", "aria-label": "Settings", children: <Icon name="cog" size={20} /> },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The player's round button, in its pill. */
export const Player: Story = {
  args: { variant: "player", "aria-label": "Share your screen", children: <Icon name="screen-share" size={20} /> },
};
/** The player's button for a stream that's live: the pill lights up. */
export const PlayerLive: Story = {
  args: { ...Player.args, live: true, "aria-label": "Stop sharing", children: <Icon name="screen-on" size={20} /> },
};
/** The player's button that can't be used now: faded. */
export const PlayerUnavailable: Story = { args: { ...Player.args, unavailable: true, "aria-disabled": true } };
/** Over a stream. */
export const Stage: Story = {};
/** Over a stream, unavailable. */
export const StageUnavailable: Story = { args: { "aria-disabled": true } };
/** The fullscreen corner. */
export const Overlay: Story = {
  args: { variant: "overlay", "aria-label": "Fullscreen", children: <Icon name="fullscreen-enter" size={16} /> },
};
/** A sound's toggle. */
export const Toggle: Story = {
  args: { variant: "toggle", "aria-label": "Their sound", children: <Icon name="volume" /> },
};
/** A sound's toggle, muted. */
export const ToggleMuted: Story = {
  args: { ...Toggle.args, "aria-pressed": true, children: <Icon name="volume-off" /> },
};
/** A header button. */
export const Header: Story = {
  args: { variant: "header", "aria-label": "4 people here", children: <Icon name="people" size={18} /> },
};
/** A small pill with words. */
export const Words: Story = { args: { variant: "words", "aria-label": undefined, children: "Change" } };
