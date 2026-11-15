import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequestAccessWaiting } from "./request-access-waiting.component";

const meta = {
  title: "Request access/Waiting",
  component: RequestAccessWaiting,
  decorators: [
    (Story) => (
      <div
        style={{
          width: "var(--card-width)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3-5)",
          padding: "var(--space-6)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RequestAccessWaiting>;

export default meta;

/** The request went: waiting for the owner. */
export const Waiting: StoryObj<typeof meta> = {};
