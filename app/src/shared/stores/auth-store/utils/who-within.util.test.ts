import { describe, expect, it, vi } from "vitest";
import { onFakeClock } from "../../../../testing/factories/clock.factory";
import { aUser, installFakeApi } from "../../../../testing/fakes/api.fake";
import { whoWithin } from "./who-within.util";

describe("asking who's signed in, within a time", () => {
  it("answers who it is when the API answers in time", async () => {
    installFakeApi({ me: aUser({ email: "ana@example.com" }) });
    await expect(whoWithin(1_000)).resolves.toMatchObject({ email: "ana@example.com" });
  });

  it("gives up once the time is up, as no answer", async () => {
    onFakeClock();
    const server = installFakeApi({ me: aUser() });
    server.hanging.add("GET /api/me");
    const asked = whoWithin(1_000);
    const gaveUp = expect(asked).rejects.toMatchObject({ name: "TimeoutError" });
    await vi.advanceTimersByTimeAsync(1_000);
    await gaveUp;
  });
});
