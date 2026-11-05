import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageShell } from "./page-shell.component";

const meta = {
  title: "Shared/Page shell",
  component: PageShell,
  args: {
    variant: "form",
    labelledBy: "story-title",
    children: (
      <>
        <h1 id="story-title" style={{ margin: 0, color: "var(--text)" }}>
          You need access
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Xovê is invite only.</p>
      </>
    ),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {};
export const Home: Story = { args: { variant: "home" } };
export const Message: Story = { args: { variant: "message", children: "Loading…" } };
