# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Userscripts for browser word and puzzle games, one folder per game. Each
`*.user.js` file is the deliverable: it installs directly into Tampermonkey
(desktop) or the Userscripts app (Safari on iPhone) and updates itself from its
raw URL on `main` (see `docs/adr/0001`).

Current scripts:

- `connections/connections-color-marker.user.js` — NYT Connections: mark tiles with
  colors, submit groups in order, reconcile marks with solved groups.

No bundler and no build step. `pnpm test` runs behavior tests that load a script into
jsdom against a simulated board (`connections/test/`). Use pnpm, never npm or yarn.

## Rules that bite

- **Never move or rename a published `.user.js` file.** Its path is the install and
  update URL.
- **Bump `@version` on every user-facing change**, or installed copies never update.
  Pre-release: stay below 1.0.0 (new capability → minor, fix → patch). 1.0.0 happens
  only when the owner says to release.
- **Public identity is `dividedby` only.** No real name or personal email in code,
  headers, docs or commits. Commit as `dividedby <64715420+dividedby@users.noreply.github.com>`.
- **Pushing to `main` releases.** Unfinished work goes on a branch.
- The script reads the live game's markup (`data-testid="card-label"`,
  `data-flip-id`, `Card-module_selected`, `solved-category-container` +
  `data-level`, `connection-toast`). When the game changes, update the simulated
  board in the tests to match what it really renders.
- The game reacts to `pointerdown`, not `click`: selecting a tile programmatically
  needs the full pointer/mouse sequence (`press()` in the script).

## Definition of done

Every **user-facing change** moves these together in the same PR:

- the script's `@version` header (see above);
- `CHANGELOG.md` — entry under the script's `### [Unreleased]`, rolled into a dated
  version section at release;
- `README.md` — the script's section, when behavior a user sees changes;
- `pnpm test` passes, and new behavior gets a test against the simulated board.

Don't call a change done until it has run in the real game (desktop and phone
width), not only in jsdom.

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
