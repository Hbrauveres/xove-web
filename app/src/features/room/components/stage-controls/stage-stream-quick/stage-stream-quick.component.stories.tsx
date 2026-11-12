import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageStreamQuick } from "./stage-stream-quick.component";

const meta = {
  title: "Room/Stage stream quick",
  component: StageStreamQuick,
  args: {
    kind: "screen",
    screenSurface: "browser",
    cameras: [{ deviceId: "c1", label: "Front camera" }],
    camera: "c1",
    busy: false,
    listOpen: false,
    onListOpen: () => undefined,
    onChangeWindow: () => undefined,
    onPickCamera: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "14.25rem", padding: "var(--space-2)", background: "var(--panel)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageStreamQuick>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The screen's: a tab, and Change. */
export const Screen: Story = {};
/** The camera's: its list. */
export const Camera: Story = { args: { kind: "camera" } };
