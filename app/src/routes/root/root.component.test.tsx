import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HANDHELD_QUERY } from "../../services/media-devices-service";
import { aUser, installFakeApi } from "../../testing/fakeApi";
import { Root } from "./root.component";

/** A browser that is a phone or tablet, or a computer. */
const onDevice = (handheld: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) =>
      ({
        matches: handheld && q === HANDHELD_QUERY,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      }) as never,
  );

describe("the page's root", () => {
  it("shows a phone or tablet only the big-screen notice, and asks the API nothing", () => {
    onDevice(true);
    const server = installFakeApi({ me: aUser({ status: "MEMBER" }) });
    render(<Root />);
    expect(screen.getByRole("heading", { name: "See you on the big screen." })).toBeInTheDocument();
    expect(server.calls).toEqual([]);
  });

  it("gives a computer the app, which signs in", async () => {
    onDevice(false);
    const server = installFakeApi({ me: null });
    render(<Root />);
    expect(await screen.findByRole("link", { name: /continue with google/i })).toBeInTheDocument();
    expect(server.calls.length).toBeGreaterThan(0);
  });
});
