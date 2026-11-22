import { describe, expect, it } from "vitest";
import type { AccessRequestView, MemberView } from "@services/xove-api-service";
import { aUser, installFakeApi } from "../../../../testing/fakes/api.fake";
import { AdminStore } from "./admin.store";

const anAdmin = () => aUser({ email: "admin@example.com", name: "Admin", status: "MEMBER", admin: true });
const aRequest = (): AccessRequestView => ({
  id: 7,
  email: "bruno@example.com",
  name: "Bruno",
  avatarUrl: null,
  message: "it's me",
  createdAt: new Date().toISOString(),
});
const someMembers = (): MemberView[] => [
  { id: 1, email: "admin@example.com", name: "Admin", avatarUrl: null, admin: true },
  { id: 2, email: "ana@example.com", name: "Ana Souza", avatarUrl: null, admin: false },
];

describe("the admin store", () => {
  it("starts with no lists, then has both once loaded", async () => {
    installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    const store = new AdminStore();
    expect(store.getState()).toEqual({ lists: null, error: null, busy: false, asking: null });

    await store.load();

    expect(store.getState().lists?.requests.map((r) => r.id)).toEqual([7]);
    expect(store.getState().lists?.members.map((m) => m.id)).toEqual([1, 2]);
  });

  it("tells its readers each change", async () => {
    installFakeApi({ me: anAdmin(), requests: [], members: someMembers() });
    const store = new AdminStore();
    let told = 0;
    const stop = store.subscribe(() => told++);
    await store.load();
    stop();
    await store.load();
    expect(told).toBe(1);
  });

  it("approves a request, busy meanwhile, then reloads both lists", async () => {
    const server = installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    const store = new AdminStore();
    await store.load();

    const done = store.approve(7);
    expect(store.getState().busy).toBe(true);
    await done;

    expect(server.calls.some((c) => c.method === "POST" && c.path === "/api/admin/access-requests/7/approve")).toBe(
      true,
    );
    expect(store.getState()).toMatchObject({ busy: false, error: null });
    expect(store.getState().lists?.requests).toEqual([]);
  });

  it("declines a request and removes a member, each by its own call", async () => {
    const server = installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    const store = new AdminStore();
    await store.decline(7);
    await store.remove(2);
    expect(server.calls.some((c) => c.path === "/api/admin/access-requests/7/decline")).toBe(true);
    expect(server.calls.some((c) => c.method === "DELETE" && c.path === "/api/admin/members/2")).toBe(true);
    expect(store.getState().lists?.members.map((m) => m.id)).toEqual([1]);
  });

  it("keeps the API's words when an action fails, and still reloads", async () => {
    const server = installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    server.failures.set("POST /api/admin/access-requests/7/approve", {
      status: 409,
      body: { detail: "This request was already decided" },
    });
    const store = new AdminStore();
    await store.approve(7);
    expect(store.getState()).toMatchObject({ busy: false, error: "This request was already decided" });
    expect(store.getState().lists?.requests.map((r) => r.id)).toEqual([7]);
  });

  it("says when the lists can't load", async () => {
    const server = installFakeApi({ me: anAdmin(), requests: [], members: someMembers() });
    server.failures.set("GET /api/admin/members", { status: 403, body: { detail: "Admins only" } });
    const store = new AdminStore();
    await store.load();
    expect(store.getState()).toMatchObject({ lists: null, error: "Admins only" });
  });

  it("asks about one member's removal at a time, and any action ending closes the question", async () => {
    installFakeApi({ me: anAdmin(), requests: [aRequest()], members: someMembers() });
    const store = new AdminStore();
    store.ask(2);
    store.ask(1);
    expect(store.getState().asking).toBe(1);
    await store.approve(7);
    expect(store.getState().asking).toBeNull();
  });
});
