import type { Meta, StoryObj } from "@storybook/react-vite";
import { ICONS } from "@shared/constants/icons.constants";
import { Icon } from "./icon.component";
import type { IconName } from "@shared/types/icon.types";

const meta = {
  title: "Shared/Icon",
  component: Icon,
  args: { name: "mic", size: 20 },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One icon, at the round buttons' 20 px. */
export const One: Story = {};

/** Every icon the app draws, with its name. */
export const Every: Story = {
  render: () => (
    <ul
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, var(--size-8))",
        gap: "var(--space-4)",
        color: "var(--text)",
        listStyle: "none",
        padding: 0,
      }}
    >
      {(Object.keys(ICONS) as IconName[]).map((name) => (
        <li key={name} title={name}>
          <Icon name={name} size={20} />
        </li>
      ))}
    </ul>
  ),
};
