import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PersonRow } from "./person-row.component";

it("reads as the face, the name, the line under it, then what ends the row", () => {
  const { container } = render(
    <PersonRow face={<i>face</i>} name="Rafa" line="rafa@example.com" end={<button type="button">Remove</button>} />,
  );
  expect(container.firstElementChild).toHaveTextContent(/^faceRafarafa@example\.comRemove$/);
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
});

it("can say what the row is above the name: Signed in as", () => {
  const { container } = render(<PersonRow face={<i>face</i>} label="Signed in as" name="friend@example.com" />);
  expect(container.firstElementChild).toHaveTextContent(/^faceSigned in asfriend@example\.com$/);
});
