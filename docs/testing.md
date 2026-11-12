# Testing

How the web app is tested, with a real example of each kind, and how to run the tests. Every push runs them in the commit checks ([`ci.yml`](../.github/workflows/ci.yml)), with the build, a check that the image starts, a vulnerability scan and a static analysis.

## At a glance

| Kind                                                                               | What it proves                                                                                                                                                                                                               | Example                                                                                                                            |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [Rules as plain functions](#rules-as-plain-functions)                              | The decisions, with no browser: which device, which quality, how the ambilight is laid out, who is big; the room as data and what it shows (`features/room/stores/room-store/room.model`, `room.selectors`), in milliseconds | `services/media-devices-service/utils/is-handheld.util.test.ts`, `features/room/stores/room-store/*.test.ts`, `**/utils/*.test.ts` |
| [Components](#components)                                                          | One component's output for given props                                                                                                                                                                                       | `components/**/*.test.tsx`                                                                                                         |
| [Pages, used like a person](#pages-used-like-a-person)                             | Whole flows: a page at a URL, with a fake API and a fake LiveKit                                                                                                                                                             | `pages/*.test.tsx`, `routes/app-routes/app-routes.component.test.tsx`, `features/room/hooks/*.test.ts`                             |
| [The style check](#the-style-check)                                                | What the stylesheets promise: text readable on every surface, rules no browser drops, motion off when asked                                                                                                                  | `scripts/check-styles.ts`                                                                                                          |
| [End-to-end, every feature at every size](#end-to-end-every-feature-at-every-size) | Each feature case, in a real browser, on the whole app with its fakes, at every size: what a person sees at rest, pointed at, focused and pressed, and the frames in between (no blink, no move)                             | `e2e/**/*.e2e.ts`                                                                                                                  |
| [Pictures and sizes](#pictures-and-sizes)                                          | Each screen on every device size                                                                                                                                                                                             | The design sheet's pictures                                                                                                        |

All of it but the end-to-end tests runs with Vitest, Testing Library and jsdom (a browser's page model in Node, without WebRTC or real layout); those run with Playwright Test in Chromium.

## Rules as plain functions

Anything that decides something is a plain function, so its tests need no rendering and cover every case. From `services/media-devices-service/utils/is-handheld.util.test.ts`, with the media queries answered directly:

```ts
it("isn't, for a computer, a touch-screen laptop or a narrow window: their main pointer is fine", () => {
  browser({ "(any-pointer: coarse)": true, "(max-width: 600px)": true });
  expect(isHandheld()).toBe(false);
});
```

The same goes for the stream presets (`services/media-devices-service/constants/devices.constants.ts`) and how they're sent and capped (`services/livekit-service/utils/publish-options.util.ts`), the room's state person by person (`services/livekit-service/utils/room-state.util.ts`), the stage light's grid and mask (`features/room/utils/light-grid.util.ts`, `features/room/components/stage/stage-light/utils/`), the static's bands (`features/room/utils/static-bands.util.ts`), who is big by default and what I hear (`features/room/utils/*.util.ts`), and the mark's geometry and animation (`shared/components/wordmark/utils/`): a test fails if the favicon drifts from the geometry.

## Components

A component rendered alone, checked by what a person sees and hears from a screen reader. From `features/room/components/stage-info/stage-now-watching/stage-now-watching.component.test.tsx`:

```tsx
it("names who is on the stage, live, what they share and for how long", () => {
  render(<StageNowWatching sharer={bruno(true)} />);

  expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
  expect(screen.getByText("LIVE")).toBeInTheDocument();
  expect(screen.getByText("Screen with camera")).toBeInTheDocument();
  expect(screen.getByText("12:40")).toBeInTheDocument();
});
```

## Storybook

Every component in the new structure has its **stories** beside it (`error-notice.component.stories.tsx`): one per state, shown alone in Storybook. The code check flags a component without them ([the checks](architecture.md#the-checks)). Storybook uses the app's tokens, fonts and build settings, so a story looks as the component does in the app.

Each story also runs as a test in a real browser (headless Chromium, through Vitest's browser mode): it fails if it throws, or if it breaks an accessibility rule (axe, contrast included). That's its own run, apart from `npm test`, so the jsdom suite stays fast; the commit checks run it as `3 · Storybook`.

A story keeps its own sample text, like a test, and shows a state a person can reach: resting, floating, too long, disabled. It isn't a test of behaviour: what a component does is still tested in its `.test.tsx`.

## Pages, used like a person

Most tests render a real page, or the whole app at a URL (`testing/renderApp.tsx`), and use it the way a person does: `userEvent.click`, finding things by role and label. Two fakes stand in for the outside world:

- **`testing/fakeApi.ts`** replaces `fetch` with a small in-memory API. A test sets its state (who I am, who's sharing, a forced failure), and checks the requests the app sent (`server.calls`), headers included, so the CSRF token is tested too.
- **`testing/fakeLiveKit.ts`** replaces `livekit-client` (jsdom has no WebRTC). A test plays the other people: someone joins (`lastRoom().join(...)`), starts a screen (`publishScreen(...)`), or the browser's own "Stop sharing" bar is used (`browserStopsMyShare()`). What the next screen pick is (a window, a tab or the whole screen) is `nextSurface`. Voices too: someone's mic (`publishVoice`, with a sound track to measure), muted (`muteVoice`), and my own mic, allowed, blocked or missing (`nextMic`), with the gate set on it (`setProcessor`). Who's speaking is measured from the sound: `stubVoiceLevels()` (`testing/factories/audio.factory.ts`) fakes the browser's audio context, and a test says when a voice speaks (`speak(track, on)`); `setSpeaking` (LiveKit's own guess) stays only to show it's ignored. The browser holding the page's sound back is `holdSound()` (LiveKit's `canPlaybackAudio` false, until `startAudio` lets it play).
- **Factories** (`testing/factories/`) make each test's own data, fresh on every call: `aSharer()` (someone sharing, with new tracks), `aStreamControls()` (my screen, camera and voice controls, every action a spy), `aTrack()`, `aLiveStream()` and `anAnswer()` (the API's streams answer, for the room's model), `aFold()` (the small view's fold, every action a spy), and `onFakeClock()` (fake timers on a fixed clock, with a `userEvent` that moves them along).
- **The modal dialog:** jsdom has `<dialog>` but not `showModal()` or `close()`; `testing/setup.ts` gives them (open, and the first control focused, as the browser does). The page behind it and Escape are the browser's, checked in the e2e cases.
- **No animations:** jsdom has no `element.animate`, so `testing/setup.ts` takes away any a test gave it; where the browser can't animate, the small view just folds. A test of the move defines its own `animate`.
- **The app's settings:** `testing/setup.ts` resets what `/config.json` gave (`appConfig.reset()`) after each test; a test that needs a number of places loads its own.
- **No canvas:** jsdom has none, so `testing/setup.ts` makes every canvas give no drawing context; what draws (the ambilight, the standby screen's static) does nothing in tests. A test of the drawing stubs its own context: `recordCanvases()` (`testing/factories/canvas.factory.ts`) records what the stage light asks of it (videos drawn, blurs, cuts, never a pixel read), with `playingVideo()`; how it looks is checked in a real browser.

The room's wiring tests check that a click reaches the store, LiveKit and the API, and the screen shows the result; each sits beside the area or piece it wires (the stage, my buttons, the header, the row under the stage…), which `renderInRoom(<Stage />)` (`testing/factories/room-render.factory.tsx`) renders over the real room session on the fakes, once I'm seated; the page's own test keeps what crosses its areas (the seat, joining, the activity putting a stream on the stage, the room's errors). An area's own tests and stories give it a session from `aRoomSession()` (`testing/factories/room-session.factory.ts`) through `RoomSessionContext`, with no store behind it. What decides (the model, the hooks, the services) is tested in its own unit. They run on a fixed fake clock (`onFakeClock()` in a `beforeEach`, and `clockUser()`, a `userEvent` that moves it); a delay is passed with `pass(<the app's constant>)`, never waited out. From `features/room/components/stage/stage/stage.component.test.tsx`: Ana and Bruno share, and once my stage has been still for a second, the page tells the API whom I watch.

```tsx
it("reports whose stream is on my stage, once it settles", async () => {
  const server = await anaAndBruno();

  await pass(REPORT_STILL_MS);
  await waitFor(() =>
    expect(server.myWatch).toEqual({ sharerId: 3, kind: "screen" }),
  );
  expect(watchCalls(server)).toHaveLength(1);
});
```

The page, the hooks, the client and the room's logic all run for real; only the network, the video and the clock are fake. Hooks with logic of their own (the LiveKit connection, the room's hooks in `features/room/hooks/` and the session's in `features/room/stores/room-session/hooks/`) also have tests that render them alone (`renderHook`).

## The style check

A test may read a stylesheet (ADR-0102), but in jsdom its text says little about what a person sees, and a literal value (`#ffffff`, `44px`) repeated in tests only blocks moving the look to tokens: look values are named. What the stylesheets must promise is checked by `npm run check:styles` (`scripts/check-styles.ts`), which parses them with PostCSS and runs in the commit checks after the tests:

- **Contrast:** every text colour on every surface meets its ratio (4.5:1; faint labels 3:1), and the ink on red too.
- **One browser per rule:** no rule mixes `::-webkit-` and `::-moz-` selectors, since a browser drops a whole rule with a selector it doesn't know.
- **Glass:** a `backdrop-filter` is written once (no hand-written `-webkit-backdrop-filter`: the build adds it, and a hand-written one after a `var()` makes the minifier drop the plain line, so Chrome gets no blur), and only blurs (`blur()`, through tokens or not): the glass's colour darkens it.
- **Reduced motion:** `global.css` keeps the rule that stops every animation and transition for anyone who asks.

Its own test (`scripts/check-styles.test.ts`) feeds it small stylesheets that pass and fail. How the look comes out on screen is checked in a real browser, below.

## End-to-end, every feature at every size

Every feature of the app has numbered test cases, each written as given / when / then / must not, and **one Playwright test per case** in `e2e/`, titled by the case's id (`F-my-buttons.3 …`). They drive the whole app on its **harness** (`e2e/harness/`: the real app, the tests' fake API and LiveKit, fake people with drawn pictures; `npm run harness` serves it on http://localhost:5199, `&still=1` holds the pictures still, `&held=1` holds the room's sound back until the first click; `&page=waiting` and `&page=offered` show the queue and a seat offered), and run at every size of a selection, each with its pixel density:

| Size                        | Viewport    | Density |
| --------------------------- | ----------- | ------- |
| HD                          | 1280 × 720  | 1×      |
| Full HD                     | 1920 × 1080 | 1×      |
| A 1080p monitor on its side | 1080 × 1920 | 1×      |
| Galaxy S23 Ultra            | 384 × 824   | 3.75×   |

Phones get only the phone notice, so their sizes run the tests tagged `@phone`.

What the tests share lives once in `e2e/support/`, one module per concern; an area's own file (`e2e/stage/stage.ts`, `e2e/settings/settings.ts`, …) keeps only what's specific to it:

- `open.ts`: opening a scene, settled on conditions (the room up, its picture playing, nothing moving), and waking the stage's controls.
- `geometry.ts`: an element's box (`boxOf` fails when it isn't on the screen), boxes compared (`inside(inner, outer)`, `overlap`), their centres, the window.
- `pointer.ts`: the mouse and keyboard as a person uses them: `pointAt` (scrolled to first), `clickAt`, `restOn`, `pointAway`, `overPicture`, `tabTo`.
- `screen.ts`: what reaches the screen: `shownOpacity` (times its ancestors'), `onTop`, and `patchOf`, a patch of a screenshot measured.
- `harness.ts`: the harness's knobs: people starting and stopping, the room's sound unlocks counted, a stream of another shape or width, a voice turned on. A fake voice really speaks (a tone on its talking pattern), my mic too (in phrases with silences, through my noise gate, as LiveKit runs it), and `window.__xoveSounding(who)` says whether a voice sounds as a listener gets it.
- `cue.ts`: the talking cue against the sound, on every frame (`recordCue`, `cueAgainstSound`: lit within 0.1 s of each start, out 0.15–0.35 s after a silence, never out while it plays), each cue layer's look per frame (`recordCueLooks`, a layer per target; one recording at a time), and a ring's colour from its shadow (`ringColours`, resolved from the tokens).
- `stage.ts`: the stage, its picture, its buttons, whether its controls are shown, the tooltip on show.
- `timing.ts`: the times a case may spend, named once (the app's own constants), and `untilStill`, waiting until nothing finite is moving.
- `looks.ts`: the looks a case checks, by the app's token names, resolved by the page into computed values.
- `glass.ts`: the glass rule (design sheet, "glass fades itself, never its parent"): every shown glass under a parent that would leave its blur nothing to blur, now or on every frame of an action (`glassUnderBreakingParentsWhile`).
- `observe.ts`, `track.ts`, `frames.ts`, `state.ts`: recording an action, frame by frame, and reading the frames.

Each test opens a scene (`e2e/support/open.ts`: the clock fixed, the pictures still), and records its action with `observe` (`e2e/support/observe.ts`): the named elements' state before and after (shown, where, how they look, what a screen reader hears), a screenshot of each, every animation frame while it happens, and a strip of screenshots through it. `blinks`, `drift` and `transitioned` (`e2e/support/frames.ts`) turn the frames into "must not" checks: an element that must stay never dims or disappears, never moves. The checks are `expect.soft`, so a test records everything and reports every failure. Eight browsers run at once (`E2E_WORKERS` sets another number). `E2E_OUT` says where the records go; `E2E_BASE_URL` runs the same tests against another copy of the app.

## Pictures and sizes

jsdom has no real layout, so how each screen looks is checked in a real headless browser: the [design sheet](design.md)'s pictures are shot from the running app, with fake people and moving pictures, at every size the design sheet lists (desktops, vertical monitors, a narrow window, and the screen phones and tablets see). A visual change retakes them in the same pull request, and compares them with the design it was drawn from. What a headless browser can't do (Safari, real fullscreen) is checked by hand.

## Test rules

Every test earns its place, and runs alone, in any order, fast.

- **Useful:** a test protects a behaviour that matters and could break; a failure means a real bug. Where what a person sees is the behaviour, it's checked (the stylesheet, a class name or the computed style may be read) against a named value, never a literal (`#ffffff`, `44px`) repeated across tests (ADR-0102); no props echoed back, no tests of the fakes rather than the app, no "renders without crashing", no two tests for the same behaviour. A test of removed code leaves with it.
- **One test file per file with logic**, beside it, named the same. A test keeps its own code and values, and uses the app's constants, types and enums where a value already has a name. Logic is tested where it lives, as plain functions; a page's tests check only the wiring, split by feature.
- **Read the page as a person does:** roles, names, labels, `aria-pressed`, `aria-expanded`, `aria-disabled`, `userEvent`; and where that isn't enough, class names, markup structure or a `data-*` attribute (ADR-0102).
- **Its own data and its own setup, the most important rule:** each test builds what it needs (people from factories, its own fakes, its clock, its storage) in the test, or in a `beforeEach` that builds it fresh; never once for a whole file, never in a `beforeAll`. Every test passes alone, first, last, or alongside any other.
- **Clean after every test, by the setup, not the test:** `testing/setup.ts` clears the page, storage and cookies, puts back real timers, the media queries and the fake LiveKit, removes the stand-ins a test defined for what jsdom lacks (fullscreen, touch points), and calls the reset of every piece of the app that keeps state between renders (the toast's store, the floating store with the tooltip's warmth, the install prompt, the TV); Vitest itself puts back every spy, stubbed global and variable (`restoreMocks`, `unstubGlobals`, `unstubEnvs`). Nothing is restored inside a test's body, where a failure would skip it. A new piece of shared state gets a reset beside it, called there, and a pair of tests in `testing/setup.test.tsx`.
- **A new order every run:** the tests in each file are shuffled on every run, so a test that leans on another fails at once. The run prints its seed (`Running tests with seed "…"`); `npm test -- --sequence.seed=<seed>` replays that order. Each file runs in its own environment, so files can't lean on each other.
- **No waiting by guess:** a test waits for a condition (`findBy`, `waitFor`, `expect.poll`, auto-waiting), never a sleep "to be safe". Where the behaviour is a time (a debounce, a hover rest, a hold, an idle fade), the test spends exactly that time, named by its constant: on fake timers wherever the timer can be faked (every unit and page test; `onFakeClock()` for anything that shows a time), in real time only for what a real browser animates on its own clock (ADR-0102). `findBy` and `waitFor` give up after 1 s in jsdom, and move fake timers along by themselves: a test that needs longer is waiting in real time.
- **Fast:** a test under about 100 ms, a file under about 1.5 s, the whole suite in about 10 s; a file that grows past that splits by feature, so the workers share the load.
- **A flaky test is a bug:** fix its cause (usually time or shared state); never re-run it to pass.

These rules are being applied as the app is reorganised ([Architecture](architecture.md#where-the-code-is-going)). Every test passes alone and shuffled, builds its own data and setup, and never waits in real time. The room page's tests are one file; they move beside the room's parts when the page is split into them.

## Running them

```bash
cd app
npm test                 # once, as the checks do (shuffled; prints its seed)
npm test -- --sequence.seed=<seed>   # the same order again
npm run test:watch       # again on every save
npm run check:styles     # contrast, per-browser rules, glass, reduced motion
npm run test:alone       # every file, then every test, run alone (slow; before a PR that changes tests)
npm run test:storybook   # every story in headless Chromium, with the accessibility checks
npm run storybook        # Storybook on http://localhost:6006
npm run build            # type check, then the production build
npm run e2e              # every feature case at every size (starts the harness if it isn't running)
npm run e2e -- --project desktop-1080 e2e/pages/   # one size, one folder
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
