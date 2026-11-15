import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageShell } from "./page-shell.component";
import styles from "./page-shell.component.module.css";

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

it("holds a wide page's content in its own column, top first: admin", () => {
  render(
    <PageShell variant="wide">
      <h2>Waiting for access</h2>
    </PageShell>,
  );
  const column = screen.getByRole("main").firstElementChild;
  expect(column?.className.split(" ")).toContain(styles.wideColumn);
  expect(column).toHaveTextContent("Waiting for access");
});
