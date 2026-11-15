import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PageText } from "./page-text.component";
import styles from "./page-text.component.module.css";

it("is a paragraph of the page, the lead under its heading or a quiet note", () => {
  render(
    <>
      <PageText variant="lead">Xovê is invite only.</PageText>
      <PageText variant="note">New here? Sign in and ask for access.</PageText>
    </>,
  );
  const lead = screen.getByText("Xovê is invite only.");
  const note = screen.getByText("New here? Sign in and ask for access.");
  expect(lead.tagName).toBe("P");
  expect(lead.className.split(" ")).toContain(styles.lead);
  expect(note.className.split(" ")).toContain(styles.note);
});
