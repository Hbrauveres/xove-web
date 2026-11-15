import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { installFakeApi } from "./testing/fakeApi";

it("draws the app in the page's root once its settings are loaded", async () => {
  installFakeApi({ me: null });
  document.body.innerHTML = '<div id="root"></div>';

  await import("./main");

  expect(await screen.findByRole("link", { name: "Continue with Google" })).toBeInTheDocument();
});
