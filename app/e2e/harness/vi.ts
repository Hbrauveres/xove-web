// Just enough of vitest's `vi` for the app's test fakes to run in a real browser.
type Fn = ((...a: unknown[]) => unknown) & {
  mockImplementation: (f: (...a: unknown[]) => unknown) => Fn;
  mock: { calls: unknown[][] };
};
function fn(impl?: (...a: unknown[]) => unknown): Fn {
  let current = impl;
  const f = ((...a: unknown[]) => {
    f.mock.calls.push(a);
    return current?.(...a);
  }) as Fn;
  f.mock = { calls: [] };
  f.mockImplementation = (g) => {
    current = g;
    return f;
  };
  return f;
}
export const vi = {
  fn,
  stubGlobal: (name: string, value: unknown) => {
    (globalThis as Record<string, unknown>)[name] = value;
  },
};
