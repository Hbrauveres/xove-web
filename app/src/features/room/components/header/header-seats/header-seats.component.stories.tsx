import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeaderSeats } from "./header-seats.component";

const meta = {
  title: "Room/Header seats",
  component: HeaderSeats,
  args: { seats: { total: 3, taken: 2, waiting: 0 } },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "grid",
          gap: "var(--space-1-5)",
          width: "var(--settings-width)",
          padding: "var(--space-4)",
          background: "var(--surface)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeaderSeats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Free: Story = {};
export const Full: Story = { args: { seats: { total: 3, taken: 3, waiting: 2 } } };
