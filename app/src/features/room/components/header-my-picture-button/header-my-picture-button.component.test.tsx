import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ConnectionState } from "@services/livekit-service";
import { HeaderMyPictureButton } from "./header-my-picture-button.component";

function setup(connection: ConnectionState = "connected") {
  render(
    <MemoryRouter>
      <HeaderMyPictureButton
        me={{ id: "user-99", name: "Henrique", hue: 210, online: true }}
        isAdmin={false}
        connection={connection}
        ambilight={{ on: true, brightness: 0.9 }}
        onAmbilightChange={vi.fn()}
        onSignOut={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("my picture button", () => {
  it("is my picture, named with the connection", () => {
    setup("reconnecting");
    expect(screen.getByRole("button", { name: "Henrique: account, reconnecting" })).toBeInTheDocument();
  });

  it("opens and closes my menu", async () => {
    setup();
    const button = screen.getByRole("button", { name: /account/ });
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Account" })).toBeInTheDocument();
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
