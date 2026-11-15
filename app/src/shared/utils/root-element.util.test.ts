import { expect, it } from "vitest";
import { rootElement } from "./root-element.util";

it("finds where the page draws the app", () => {
  const page = document.implementation.createHTMLDocument();
  page.body.innerHTML = '<div id="root"></div>';
  expect(rootElement(page).id).toBe("root");
});

it("says so plainly when the page has no place for the app", () => {
  const page = document.implementation.createHTMLDocument();
  expect(() => rootElement(page)).toThrow("The page has no #root element to draw the app in.");
});
