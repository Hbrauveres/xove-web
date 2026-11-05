import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageShell } from "./page-shell.component";

it("is the page's main region, its column named by its heading", () => {
  render(
    <PageShell variant="home" labelledBy="title">
      <h1 id="title">Go live with your friends.</h1>
    </PageShell>,
  );
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Go live with your friends." })).toBeInTheDocument();
});

it("holds a message without a column, passing its own props on", () => {
  render(<PageShell variant="message">Loading…</PageShell>);
  expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  expect(screen.queryByRole("region")).toBeNull();
});
