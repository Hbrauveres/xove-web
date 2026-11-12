import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ConnectionState } from "@services/livekit-service";
import type { HeaderMyMenuProps } from "./types/header-my-menu.types";
import { HeaderMyMenu } from "./header-my-menu.component";

function setup(props: Partial<HeaderMyMenuProps> = {}) {
  const onSignOut = vi.fn();
  const onAmbilightChange = vi.fn();
  render(
    <MemoryRouter>
      <HeaderMyMenu
        open
        anchor={createRef<HTMLElement>()}
        onClose={vi.fn()}
        me={{ id: "user-99", name: "Henrique", hue: 210, online: true }}
        isAdmin
        connection={"connected" as ConnectionState}
        ambilight={{ on: true, brightness: 0.9 }}
        onAmbilightChange={onAmbilightChange}
        onSignOut={onSignOut}
        {...props}
      />
    </MemoryRouter>,
  );
  return {
    user: userEvent.setup(),
    onSignOut,
    onAmbilightChange,
    panel: screen.getByRole("dialog", { name: "Account" }),
  };
}

describe("my menu", () => {
  it("shows my name, role and connection, the ambilight, Admin and Sign out", async () => {
    const { user, onSignOut, panel } = setup();
    expect(within(panel).getByText("Henrique")).toBeInTheDocument();
    expect(within(panel).getByText("Admin", { selector: "small" })).toBeInTheDocument();
    expect(within(panel).getByText("Connected")).toBeInTheDocument();
    expect(within(panel).getByRole("switch", { name: "Ambilight" })).toBeChecked();
    expect(within(panel).getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");

    await user.click(within(panel).getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalled();
  });

  it("shows Admin only to admins, and Member as the role otherwise", () => {
    setup({ isAdmin: false });
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("says the connection in words", () => {
    setup({ connection: "disconnected" });
    expect(screen.getByText("Video offline")).toBeInTheDocument();
  });

  it("switches the ambilight and sets its brightness", async () => {
    const { user, onAmbilightChange } = setup();

    await user.click(screen.getByRole("switch", { name: "Ambilight" }));
    expect(onAmbilightChange).toHaveBeenLastCalledWith({ on: false, brightness: 0.9 });
    // Space toggles it too, from the keyboard (the test's prefs stay on, so it asks for off again).
    const calls = onAmbilightChange.mock.calls.length;
    screen.getByRole("switch", { name: "Ambilight" }).focus();
    await user.keyboard(" ");
    expect(onAmbilightChange).toHaveBeenCalledTimes(calls + 1);

    fireEvent.change(screen.getByRole("slider", { name: "Ambilight brightness" }), { target: { value: "0.85" } });
    expect(onAmbilightChange).toHaveBeenLastCalledWith({ on: true, brightness: 0.85 });
  });
});
