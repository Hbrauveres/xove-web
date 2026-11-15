import { expect, it } from "vitest";
import { ApiError } from "../xove-api.service";
import { apiErrorMessage } from "./api-error-message.util";

it("shows the API's own words, which are safe to show", () => {
  expect(apiErrorMessage(new ApiError(400, "Message is too long (max 500 characters)"), "Try again.")).toBe(
    "Message is too long (max 500 characters)",
  );
});

it("says the place's own words for anything else, such as the network failing", () => {
  expect(apiErrorMessage(new TypeError("Failed to fetch"), "Couldn't send your request. Try again.")).toBe(
    "Couldn't send your request. Try again.",
  );
});
