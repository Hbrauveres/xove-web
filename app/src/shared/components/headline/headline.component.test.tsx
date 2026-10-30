import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Headline } from "./headline.component";

describe("a headline", () => {
  it("is a heading of its level, read as its words", () => {
    render(
      <Headline level="section">
        Go <em>live</em>
      </Headline>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Go live" })).toBeInTheDocument();
  });

  it("can be the page's own heading", () => {
    render(<Headline level="page">Welcome</Headline>);
    expect(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeInTheDocument();
  });
});
