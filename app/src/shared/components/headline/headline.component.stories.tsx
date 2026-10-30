import type { Meta, StoryObj } from "@storybook/react-vite";
import { Headline } from "./headline.component";

const meta = {
  title: "Shared/Headline",
  component: Headline,
  args: {
    level: 2,
    children: (
      <>
        Go <em>live</em>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ font: "800 var(--text-28)/1.1 var(--font-display)", color: "var(--text)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Headline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The empty stage's: its key word in the accent. */
export const KeyWord: Story = {};
