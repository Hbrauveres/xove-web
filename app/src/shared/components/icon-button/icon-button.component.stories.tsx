import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@shared/components/icon";
import { IconButton } from "./icon-button.component";

const meta = {
  title: "Shared/Icon button",
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--space-6)", background: "var(--grey-15)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Round, M 34: every round button but my own (the sounds, fullscreen, the small view's, the preview's row). */
export const RoundM: Story = {
  render: () => (
    <IconButton variant="round" size="m" aria-label="Settings">
      <Icon name="cog" />
    </IconButton>
  ),
};
/** Round, M 34, unavailable: faded, saying why in its tooltip. */
export const RoundMUnavailable: Story = {
  render: () => (
    <IconButton variant="round" size="m" unavailable aria-label="Their sound: no sound shared">
      <Icon name="sound" />
    </IconButton>
  ),
};
/** A muted sound: the same base, its own icon. */
export const RoundMMuted: Story = {
  render: () => (
    <IconButton variant="round" size="m" aria-pressed aria-label="Unmute their sound">
      <Icon name="volume-off" />
    </IconButton>
  ),
};
/** Round, L 48: my own buttons. */
export const RoundL: Story = {
  render: () => (
    <IconButton variant="round" size="l" aria-label="Share your screen">
      <Icon name="screen-share" />
    </IconButton>
  ),
};
/** Round, L 48, on: a stream that's live, a mic that's on. */
export const RoundLLive: Story = {
  render: () => (
    <IconButton variant="round" size="l" live aria-label="Stop sharing">
      <Icon name="screen-on" />
    </IconButton>
  ),
};
/** Round, M 34, talking: the green tube and glow while the voice is heard. */
export const RoundMTalking: Story = {
  render: () => (
    <IconButton variant="round" size="m" data-cue="talking" aria-label="Mute Marina's voice">
      <Icon name="voice" />
    </IconButton>
  ),
};
/** A header button. */
export const Header: Story = {
  render: () => (
    <IconButton variant="header" aria-label="4 people here">
      <Icon name="people" size={18} />
    </IconButton>
  ),
};
/** A panel's close. */
export const Close: Story = {
  render: () => (
    <IconButton variant="close" aria-label="Close settings">
      <Icon name="close" size={20} />
    </IconButton>
  ),
};
