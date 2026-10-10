# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Userscripts for browser word and puzzle games, one folder per game. Each
`*.user.js` file is the deliverable: it installs directly into Tampermonkey
(desktop) or the Userscripts app (Safari on iPhone) and updates itself from its
raw URL on `main` (see `docs/adr/0001`). Scripts are also listed on Greasy Fork, whose
installs update from Greasy Fork instead (`docs/adr/0002`).

Current scripts:

- `connections/connections-color-marker.user.js` — NYT Connections: mark tiles with
  colors (or split them between candidate colors), submit groups in order, reconcile
  marks with solved groups.
- `wordle/wordle-shortlist.user.js` — NYT Wordle: a random starting word, then a
  shortlist of 5 possible answers each turn; tap one to play it.

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
  Pre-release: stay below 1.0.0 (new capability → minor, fix → patch). 1.0.0 happens
  only when the owner says to release.
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
  Userscripts app, so ask before testing a new version.

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
