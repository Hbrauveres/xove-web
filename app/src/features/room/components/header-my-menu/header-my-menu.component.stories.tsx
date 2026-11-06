import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { MemoryRouter } from "react-router";
import { HeaderMyMenu } from "./header-my-menu.component";
import type { HeaderMyMenuProps } from "./types/header-my-menu.types";

/** My menu, open under a stand-in for my picture. */
function Open(props: Omit<HeaderMyMenuProps, "anchor" | "open" | "onClose">) {
  const anchor = useRef<HTMLSpanElement>(null);
  return (
    <MemoryRouter>
      <div style={{ display: "flex", justifyContent: "flex-end", minHeight: "var(--settings-width)" }}>
        <span ref={anchor}>Me</span>
        <HeaderMyMenu {...props} open anchor={anchor} onClose={() => undefined} />
      </div>
    </MemoryRouter>
  );
}

const meta = {
  title: "Room/Header my menu",
  component: Open,
  args: {
    me: { id: "me", name: "Henrique", hue: 210, online: true },
    isAdmin: true,
    connection: "connected",
    ambilight: { on: true, brightness: 0.9 },
    onAmbilightChange: () => undefined,
    onSignOut: () => undefined,
  },
} satisfies Meta<typeof Open>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Admin: Story = {};
export const Member: Story = { args: { isAdmin: false, connection: "reconnecting" } };
