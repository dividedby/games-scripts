# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Userscripts for browser word and puzzle games, one folder per game. Each
`*.user.js` file is the deliverable: it installs directly into Tampermonkey
(desktop) or the Userscripts app (Safari on iPhone) and updates itself from its
raw URL on `main` (see `docs/adr/0001`). Scripts are also listed on Greasy Fork, whose
installs update from Greasy Fork instead (`docs/adr/0002`).

Current scripts:

- `connections/connections-color-marker.user.js` — Connections Palette (renamed from
  Connections Color Marker at 1.0; the file keeps its old name) — NYT Connections: mark tiles with
  colors (or split them between candidate colors), submit groups in order, reconcile
  marks with solved groups. Adds buttons to the game's own row: **Definition** (one tile
  selected: Wiktionary senses + Wikidata names, fetched only on tap, cached 60 days in
  `ccm:defs`) and **Guide** (what each color tends to be); both open a panel over the board.
- `wordle/wordle-shortlist.user.js` — NYT Wordle: a random starting word, then a
  shortlist of 5 possible answers each turn; tap one to play it.
- `nyt-dark/nyt-games-dark.user.js` — NYT Games Dark: switches on the dark color set NYT
  already ships (`[data-mode=dark].display-settings-enabled` on `<html>` and `<body>`,
  plus `.dark` on `<body>`) and patches the parts without dark colors: `.pz-nav` header
  and `.pz-nav-drawer` menu by CSS, and plain white/gray panels inside start, results and
  modal screens by marking them `data-nytd-panel` (colorful brand panels are left alone). Adds `<meta name="darkreader-lock">` so Dark Reader stands back;
  Noir ignores it (and `color-scheme`), so Noir users turn it off for nytimes.com.
  Archives, the home page, stats and footer get the same plain-white marking (scoped by
  `PANELS`), plus text fixed by its real backdrop (`data-nytd-ink`) and black icons flipped
  (`data-nytd-flip`). News-style pages (hints, forums, the bots, help.nytimes.com) swap NYT's
  `tpl-always-light` class on `<html>` for `tpl-always-dark` and scan the whole body.

- `minute-cryptic/minute-cryptic-plus.user.js` — Minute Cryptic Plus (0.x, pre-release) —
  minutecryptic.com: hides the game's keyboard (`.react-simple-keyboard`) for the phone's own
  (a hidden field; letters reach the game as keydown on the page), and extends the scribble
  space through its React context (found from the `Circle layout` button's fiber; names like
  `gridAdapter.getCells/writeLetter`, `dragLetterFromGrid`, `dropTileOnGrid`, `shuffleTiles`).
  Never read a cell's `answer` (the state holds it): only `index`, `letter`, `isRevealed`.
  Never solve or hint the owner's daily puzzle; test with letters like q/x/z and clear them.

Each script folder holds the script, its `README.md` (the user guide),
`greasyfork-description.md` (the Greasy Fork listing, synced from `main`) and
`test/`. Screenshots live in `docs/images/<script>/`; the READMEs and the Greasy Fork
listing link to them by path, so keep the file names. The root `README.md` only lists
scripts and install steps. Domain terms are in `CONTEXT.md`.

No bundler and no build step. `pnpm test` runs behavior tests that load each script
into jsdom against a simulated board (`<script folder>/test/`). Use pnpm, never npm or yarn.

## Rules that bite

- **Never move or rename a published `.user.js` file.** Its path is the install and
  update URL.
- **Bump `@version` on every user-facing change**, or installed copies never update.
  Connections Palette, Wordle Shortlist and NYT Games Dark are past 1.0 (new capability → minor,
  fix → patch); Minute Cryptic Plus is 0.x until the owner calls it ready.
- **Public identity is `dividedby` only.** No real name or personal email in code,
  headers, docs or commits. Commit as `dividedby <64715420+dividedby@users.noreply.github.com>`.
- **Pushing to `main` releases**, everywhere: GitHub installs pick it up directly, and
  Greasy Fork syncs the script and its description from `main` on its own. Unfinished
  work goes on a branch.
- Never change `@namespace` (Greasy Fork and the managers key installs on it), and keep
  `@updateURL`/`@downloadURL` on the GitHub raw URL (Greasy Fork strips them itself).
- The scripts read the live games' markup. Connections: `data-testid="card-label"`,
  `data-flip-id`, `Card-module_selected`, `solved-category-container` +
  `data-level`, `connection-toast`. Wordle: `data-testid="tile"` with `data-state`
  (`empty`/`tbd`/`correct`/`present`/`absent`), keyboard buttons `data-key` (`↵`, `←`). When a
  game changes, update the simulated board in the tests to match what it really renders.
- Connections reacts to `pointerdown`, not `click`: selecting a tile programmatically
  needs the full pointer/mouse sequence (`press()` in the script). Wordle's keyboard
  takes plain `.click()`.
- Wordle only colors a row once its flip animation ends, and Chrome doesn't run
  animations in a hidden tab: test with the window in front.

## Userscript engineering

Before changing a `.user.js`, read [`docs/agents/userscript-guidelines.md`](docs/agents/userscript-guidelines.md),
the full checklist (shared by all the dividedby userscript repos). The rules that matter most:

- **Smallest reliable change.** Preserve existing behavior, fix the problem at hand without
  unrelated rewrites, and add no dependency, build step or abstraction without a reason.
- **Metadata.** Narrow `@match`; only the `@grant`s actually used (`@grant none` stated
  explicitly); no wildcard `@connect`; `@run-at` chosen by need. Never change `@namespace` or
  the update URLs.
- **Untrusted input** (page text, network responses, anything read back from storage) never
  goes into `innerHTML`: build DOM with `textContent`. No `eval`, `new Function` or remote code.
- **Validate stored values** (type and shape) before using them; keep storage keys namespaced.
- **Safe to run twice** (a second install, re-initialization): no duplicate UI, listeners,
  styles or observers.
- **Observers and timers.** Observe the smallest stable root with filters, ignore the script's
  own mutations, never poll without a bound, and read layout before writing it.
- **Network and errors.** Time out, check status and response shape, ignore stale results; no
  silent `catch {}` for unexpected errors (log with the script's prefix; leave a comment where
  swallowing is intended, e.g. storage in private mode).
- **Navigation.** `popstate` doesn't see `pushState`; redirects use `location.replace` so Back
  still works; a patched page API keeps its arguments, `this` and return value.
- **Validation.** Node/jsdom tests don't prove the script works in a manager: check it on the
  real site and say exactly what was and wasn't tested.

Deliberate exceptions here: no `@noframes` (phone-width testing runs the installed script in a
same-origin 390px iframe of the game); NYT Games Dark runs at `document-start` so its colors
are on before first paint (no white flash).

## Definition of done

Every **user-facing change** moves these together in the same PR:

- the script's `@version` header (see above);
- `CHANGELOG.md` — entry under the script's `### [Unreleased]`, rolled into a dated
  version section at release;
- `<script folder>/README.md` — when behavior a user sees changes (the root
  `README.md` only lists scripts and install steps; add a row when adding a script);
- `<script folder>/greasyfork-description.md` — when the listing's text or "New in"
  section goes stale (Greasy Fork syncs it from `main`);
- `pnpm test` passes, and new behavior gets a test against the simulated board.

Don't call a change done until it has run in the real game (desktop and phone
width), not only in jsdom.

## Testing in the real game

- Use 2023 archive puzzles (`/games/connections/2023-MM-DD`,
  `/games/wordle/2023-MM-DD`): the owner won't replay them. Never play today's
  Wordle. Wordle Shortlist has the same debug hook: `wsl:debug` exposes
  `window.__wslRoot` and `window.__wsl`. Answers: `/svc/connections/v2/YYYY-MM-DD.json` on nytimes.com. Leave puzzles
  the owner opened for you unsolved and cleared afterwards unless asked.
- Desktop: the owner's Chrome tab group "Claude" (desktop and phone-width tabs). Set
  localStorage `ccm:debug` to `true` and reload to expose the palette's shadow root as
  `window.__ccmRoot`; remove it when done. The phone-width tab doesn't take real
  clicks, so drive it from page JavaScript.
- Phone width without a phone: Chrome won't size a window below ~500px, but a 390px
  same-origin iframe of the game (`/games/wordle/2023-MM-DD`) gets phone media queries,
  the real page CSS and the installed script. The page's CSS overrides `padding` and
  `margin` on a script's host element, so put spacing inside the shadow root.
- iPhone: real taps through iPhone Mirroring. It lags several seconds and drops quick
  taps, so tap slowly and screenshot after each step. Typing garbles text, so navigate
  by tapping (or ask the owner to open a URL). Zooming the full window gives a 2×
  screenshot good enough for the README.
- Installed copies update only after the owner updates them in Tampermonkey and the
  Userscripts app, so ask before testing a new version. To test an unreleased build, inject the
  raw file at its commit with `(0,eval)(src)` after renaming the installed copy's root
  (`#ccm-root`, `#wsl-root`, `#nytd-style`): each script exits if it finds its own root, so a
  second copy otherwise won't start. Two copies of NYT Games Dark interfere with each other;
  compare builds on a script-free `srcdoc` snapshot of the page instead.
- Greasy Fork can lag `main` by a day or more: check the version it serves at
  `greasyfork.org/en/scripts/<id>.json` (Connections 599362, Wordle 599505, Dark 599796).

## Wordle word lists

The word block in `wordle-shortlist.user.js` is generated: likely answers in CAPITALS,
other guessable words lowercase. Never edit it by hand; `pnpm update-words` rebuilds it
from WordGamesBot and bumps the patch version and changelog when it changed. The
monthly workflow `.github/workflows/update-wordle-words.yml` runs the same command and
opens a pull request (it needs "Allow GitHub Actions to create and approve pull
requests" on in the repo's Actions settings). GitHub turns scheduled workflows off after
60 days without repository activity; re-enable it from the Actions tab if that happens.

## Agent skills

### Issue tracker
GitHub issues in `dividedby/games-scripts` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels
State: `needs-triage`, `ready-for-agent`, `ready-for-human`, `blocked`, `wontfix`. Category: `bug`, `enhancement`, `chore`, `epic`. Size: `size:S/M/L/XL`. See `docs/agents/triage-labels.md`.

### Domain docs
Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Changelog
See `docs/agents/changelog-guideline.md`.

## Intake convention

When I say **"file an idea"** or **"file an issue"** (unqualified), append an
**enriched row** to this repo's [**Idea Inbox**](https://github.com/dividedby/games-scripts/issues/1) issue (label
`idea-inbox`, one per repo): the raw idea **plus the ambient context/links
available right now** — the source file/issue/PR that prompted it and a sentence
of why — as an unchecked item at the TOP of `## Ideas`. Do not grill or scope it
yet; that happens at drain. The capture and drain protocol lives once in
[`docs/agents/idea-inbox.md`](./docs/agents/idea-inbox.md) (the issue body is
human-facing and carries no operating instructions).

When I say **"file a *tracked* issue"** — or hand you a **plainly-scoped bug** —
skip the Inbox and file a `needs-triage` issue directly via `gh`.

GitHub's GraphQL API isn't available from Claude Code sessions: use `gh api` REST
routes (`gh api repos/dividedby/games-scripts/issues/...`), not `gh issue`.
