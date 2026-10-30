# Testing

How the web app is tested, with a real example of each kind, and how to run the tests. Every push runs them in the commit checks ([`ci.yml`](../.github/workflows/ci.yml)), with the build, a check that the image starts, a vulnerability scan and a static analysis.

## At a glance

| Kind | What it proves | Example |
| --- | --- | --- |
| [Rules as plain functions](#rules-as-plain-functions) | The decisions, with no browser: which device, which quality, how the ambilight is laid out, who is big; the room as data and what it shows (`features/room/stores/room-store/room.model`, `room.selectors`), in milliseconds | `services/media-devices-service/utils/is-handheld.util.test.ts`, `media/*.test.ts`, `brand/*.test.ts`, `features/room/stores/room-store/*.test.ts`, `**/utils/*.test.ts` |
| [Components](#components) | One component's output for given props | `components/**/*.test.tsx` |
| [Pages, used like a person](#pages-used-like-a-person) | Whole flows: a page at a URL, with a fake API and a fake LiveKit | `pages/*.test.tsx`, `routes/app-routes/app-routes.component.test.tsx`, `features/room/hooks/*.test.ts` |
| [The style check](#the-style-check) | What the stylesheets promise: text readable on every surface, rules no browser drops, motion off when asked | `scripts/check-styles.ts` |
| [Pictures and sizes](#pictures-and-sizes) | Each screen on every device size | The design sheet's pictures |

All of it runs with Vitest, Testing Library and jsdom (a browser's page model in Node, without WebRTC or real layout).

## Rules as plain functions

Anything that decides something is a plain function, so its tests need no rendering and cover every case. From `services/media-devices-service/utils/is-handheld.util.test.ts`, with the media queries answered directly:

```ts
it("isn't, for a computer, a touch-screen laptop or a narrow window: their main pointer is fine", () => {
  browser({ "(any-pointer: coarse)": true, "(max-width: 600px)": true });
  expect(isHandheld()).toBe(false);
});
```

The same goes for the stream presets (`services/media-devices-service/constants/devices.constants.ts`) and how they're sent and capped (`services/livekit-service/utils/publish-options.util.ts`), the room's state person by person (`services/livekit-service/utils/room-state.util.ts`), the ambilight's grid and mask (`media/ambilight.ts`), who is big by default and what I hear (`features/room/utils/*.util.ts`), and the mark's geometry and animation (`brand/`): a test fails if the favicon drifts from the geometry.

## Components

A component rendered alone, checked by what a person sees and hears from a screen reader. From `components/stage/NowWatching.test.tsx`:

```tsx
it("names who is on the stage, live, what they share and for how long", () => {
  render(<NowWatching sharer={bruno(true)} />);

  expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
  expect(screen.getByText("LIVE")).toBeInTheDocument();
  expect(screen.getByText("Screen with camera")).toBeInTheDocument();
  expect(screen.getByText("12:40")).toBeInTheDocument();
});
```

## The workbench

Every component in the new structure has its **stories** beside it (`error-notice.component.stories.tsx`): one per state, shown alone in the component workbench (Storybook). The code check flags a component without them ([the checks](architecture.md#the-checks)). The workbench uses the app's tokens, fonts and build settings, so a story looks as the component does in the app.

Each story also runs as a test in a real browser (headless Chromium, through Vitest's browser mode): it fails if it throws, or if it breaks an accessibility rule (axe, contrast included). That's its own run, apart from `npm test`, so the jsdom suite stays fast; the commit checks run it as `3 · Workbench`.

A story keeps its own sample text, like a test, and shows a state a person can reach: resting, floating, too long, disabled. It isn't a test of behaviour: what a component does is still tested in its `.test.tsx`.

## Pages, used like a person

Most tests render a real page, or the whole app at a URL (`testing/renderApp.tsx`), and use it the way a person does: `userEvent.click`, finding things by role and label. Two fakes stand in for the outside world:

- **`testing/fakeApi.ts`** replaces `fetch` with a small in-memory API. A test sets its state (who I am, who's sharing, a forced failure), and checks the requests the app sent (`server.calls`), headers included, so the CSRF token is tested too.
- **`testing/fakeLiveKit.ts`** replaces `livekit-client` (jsdom has no WebRTC). A test plays the other people: someone joins (`lastRoom().join(...)`), starts a screen (`publishScreen(...)`), or the browser's own "Stop sharing" bar is used (`browserStopsMyShare()`). What the next screen pick is (a window, a tab or the whole screen) is `nextSurface`. Voices too: someone's mic (`publishVoice`, `muteVoice`), who's speaking (`setSpeaking`), and my own mic, allowed, blocked or missing (`nextMic`), with the gate set on it (`setProcessor`).
- **Factories** (`testing/factories/`) make each test's own data, fresh on every call: `aSharer()` (someone sharing, with new tracks), `aTrack()`, `aLiveStream()` and `anAnswer()` (the API's streams answer, for the room's model), and `onFakeClock()` (fake timers on a fixed clock, with a `userEvent` that moves them along).
- **No canvas:** jsdom has none, so `testing/setup.ts` makes every canvas give no drawing context; what draws (the ambilight, the standby screen's static) does nothing in tests. A test of the drawing stubs its own context (`vi.spyOn(HTMLCanvasElement.prototype, "getContext")`), and how it looks is checked in a real browser.

The room page's tests check only the wiring: that a click on the page reaches the store, LiveKit and the API, and the screen shows the result. What decides (the model, the hooks, the services) is tested in its own unit. They run on a fixed fake clock (`onFakeClock()` in a `beforeEach`, and `clockUser()`, a `userEvent` that moves it); a delay is passed with `pass(<the app's constant>)`, never waited out. From `pages/RoomPage.test.tsx`: Ana and Bruno share, and once my stage has been still for a second, the page tells the API whom I watch.

```tsx
it("reports whose stream is on my stage, once it settles", async () => {
  const server = await anaAndBruno();

  await pass(REPORT_STILL_MS);
  await waitFor(() => expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }));
  expect(watchCalls(server)).toHaveLength(1);
});
```

The page, the hooks, the client and the room's logic all run for real; only the network, the video and the clock are fake. Hooks with logic of their own (the LiveKit connection, the room's hooks in `features/room/hooks/`) also have tests that render them alone (`renderHook`).

## The style check

Tests never read CSS: a stylesheet's text says nothing about what a person sees, and checking literal values (`#ffffff`, `44px`) only blocks moving the look to tokens. What the stylesheets must promise is checked by `npm run check:styles` (`scripts/check-styles.ts`), which parses them with PostCSS and runs in the commit checks after the tests:

- **Contrast:** every text colour on every surface meets its ratio (4.5:1; faint labels 3:1), and the ink on red too.
- **One browser per rule:** no rule mixes `::-webkit-` and `::-moz-` selectors, since a browser drops a whole rule with a selector it doesn't know.
- **Reduced motion:** `global.css` keeps the rule that stops every animation and transition for anyone who asks.

Its own test (`scripts/check-styles.test.ts`) feeds it small stylesheets that pass and fail. How the look comes out on screen is checked in a real browser, below.

## Pictures and sizes

jsdom has no real layout, so how each screen looks is checked in a real headless browser: the [design sheet](design.md)'s pictures are shot from the running app, with fake people and moving pictures, at every size the design sheet lists (desktops, vertical monitors, a narrow window, and the screen phones and tablets see). A visual change retakes them in the same pull request, and compares them with the design it was drawn from. What a headless browser can't do (Safari, real fullscreen) is checked by hand.

## Test rules

Every test earns its place, and runs alone, in any order, fast.

- **Useful:** a test protects a behaviour that matters and could break; a failure means a real bug. No CSS text or literal values (`#ffffff`, `44px`), no props echoed back, no tests of the fakes rather than the app, no "renders without crashing", no two tests for the same behaviour. A test of removed code leaves with it.
- **One test file per file with logic**, beside it, named the same. A test keeps its own code and values, and uses the app's constants, types and enums where a value already has a name. Logic is tested where it lives, as plain functions; a page's tests check only the wiring, split by feature.
- **Read the page as a person does:** roles, names, labels, `aria-pressed`, `aria-expanded`, `aria-disabled`, `userEvent`; never markup details or class names. A `data-*` attribute only when it's the only sign of a state.
- **Its own data and its own setup, the most important rule:** each test builds what it needs (people from factories, its own fakes, its clock, its storage) in the test, or in a `beforeEach` that builds it fresh; never once for a whole file, never in a `beforeAll`. Every test passes alone, first, last, or alongside any other.
- **Clean after every test, by the setup, not the test:** `testing/setup.ts` clears the page, storage and cookies, puts back real timers, the media queries and the fake LiveKit, removes the stand-ins a test defined for what jsdom lacks (fullscreen, touch points), and calls the reset of every piece of the app that keeps state between renders (the toast, the floating piece, the tooltip's warmth, the install prompt, the TV); Vitest itself puts back every spy, stubbed global and variable (`restoreMocks`, `unstubGlobals`, `unstubEnvs`). Nothing is restored inside a test's body, where a failure would skip it. A new piece of shared state gets a reset beside it, called there, and a pair of tests in `testing/setup.test.tsx`.
- **A new order every run:** the tests in each file are shuffled on every run, so a test that leans on another fails at once. The run prints its seed (`Running tests with seed "…"`); `npm test -- --sequence.seed=<seed>` replays that order. Each file runs in its own environment, so files can't lean on each other.
- **No real waiting:** every delay (debounce, retry, hover, hold, idle, animation) on fake timers, and a fixed clock for anything that shows a time (`onFakeClock()`). `findBy` and `waitFor` give up after 1 s, and move fake timers along by themselves: a test that needs longer is waiting in real time.
- **Fast:** a test under about 100 ms, a file under about 1.5 s, the whole suite in about 10 s; a file that grows past that splits by feature, so the workers share the load.
- **A flaky test is a bug:** fix its cause (usually time or shared state); never re-run it to pass.

These rules are being applied as the app is reorganised ([Architecture](architecture.md#where-the-code-is-going)). Every test passes alone and shuffled, builds its own data and setup, and never waits in real time. The room page's tests are one file; they move beside the room's parts when the page is split into them.

## Running them

```bash
cd app
npm test                 # once, as the checks do (shuffled; prints its seed)
npm test -- --sequence.seed=<seed>   # the same order again
npm run test:watch       # again on every save
npm run check:styles     # contrast, per-browser rules, reduced motion
npm run test:alone       # every file, then every test, run alone (slow; before a PR that changes tests)
npm run test:workbench   # every story in headless Chromium, with the accessibility checks
npm run workbench        # the component workbench on http://localhost:6006
npm run build            # type check, then the production build
```

## What a good test here looks like

- Named after the behaviour, as a sentence: `"ends the stream when the browser's own Stop sharing bar is used"`.
- Arrange, act, assert, separated by blank lines.
- Asserts on what a person sees (text, roles, names) or on what the app sent, not on internals.
- No sleeps: `findBy…` and `waitFor` for what comes later, `onFakeClock()` when time matters.
- A call the app makes after a render (a fake's `toHaveBeenCalled…`) is checked inside the `waitFor`, next to what it waits for, not right after it: on a slow machine it can land a moment later.

## Before opening a pull request

```bash
cd app && npm test && npm run check:styles && npm run build
```

If that passes, the checks' unit test and build stages will too.
