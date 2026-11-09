import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@shared/stores/auth-store";
import { LiveRoom } from "./live-room.factory";

/** Renders one of the room's areas over the real room session, for its wiring tests. */
export function renderInRoom(area: ReactNode, onSignOut: () => void = () => undefined) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LiveRoom onSignOut={onSignOut}>{area}</LiveRoom>
      </AuthProvider>
    </MemoryRouter>,
  );
}
