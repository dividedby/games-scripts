# games-scripts

Userscripts for browser word and puzzle games, one folder per game. Each `*.user.js`
file is the deliverable: it installs into Tampermonkey (desktop) or the Userscripts
app (Safari on iPhone) and updates itself from its raw URL on `main`
(`docs/adr/0001`). The scripts are also on Greasy Fork, whose installs update from
Greasy Fork (`docs/adr/0002`). Domain terms: `GLOSSARY.md`.

Scripts: `connections/connections-color-marker.user.js` (Connections Palette; the file
keeps its pre-1.0 name), `wordle/wordle-shortlist.user.js`,
`nyt-dark/nyt-games-dark.user.js`, `minute-cryptic/minute-cryptic-plus.user.js`
(0.x). Each folder also holds its `README.md` (user guide),
`greasyfork-description.md` (the listing, synced from `main`) and `test/`.
Screenshots live in `docs/images/<script>/` and are linked by path, so keep the file
names. The root `README.md` only lists scripts and install steps.

## Commands

No bundler, no build step. Use pnpm.

- `pnpm test`: behavior tests that load each script into jsdom against a simulated board.
- `pnpm format:check` (Prettier; `pnpm format` writes). CI: `.github/workflows/format.yml`.
- Lint: no linter; `pnpm format:check` is the only static check.
- `pnpm update-words`: rebuild the Wordle word block (see `.claude/rules/wordle.md`).

## Hard rules

- **Minute Cryptic Plus: never read a cell's `answer`** (the game's state holds it; only
  `index`, `letter`, `isRevealed`) and never solve or hint the owner's daily puzzle. Test
  with letters like q/x/z and clear them.
- **Never move or rename a published `.user.js` file.** Its path is the install and
  update URL.
- Never change `@namespace` (Greasy Fork and the managers key installs on it); keep
  `@updateURL`/`@downloadURL` on the GitHub raw URL (Greasy Fork strips them itself).
- **Bump `@version` on every user-facing change**, or installed copies never update.
  Connections Palette, Wordle Shortlist and NYT Games Dark are past 1.0 (new capability
  → minor, fix → patch); Minute Cryptic Plus is 0.x until the owner calls it ready.
- **Public identity is `dividedby` only.** No real name or personal email in code,
  headers, docs or commits. Commit as `dividedby <64715420+dividedby@users.noreply.github.com>`.
- **Pushing to `main` releases**, everywhere: GitHub installs pick it up directly, and
  Greasy Fork syncs the script and its description from `main` on its own. Unfinished
  work goes on a branch.
- When a game changes its markup, update the simulated board in the tests to match what
  it really renders.

## Definition of done

A user-facing change moves these together in the same PR: the script's `@version`;
`CHANGELOG.md` (entry under the script's `### [Unreleased]`); the script's `README.md`
when what a user sees changes (add a root `README.md` row for a new script); its
`greasyfork-description.md` when the listing text or "New in" section goes stale; a
test against the simulated board for new behavior; `pnpm test` passing. It isn't done
until it has run in the real game, desktop and phone width, not only in jsdom (Chrome,
the built-in browser, or the `mobile-safari` skill). Test on 2023 archive puzzles
(`/games/wordle/2023-MM-DD`), never today's Wordle, and leave puzzles the owner opened
unsolved. Wordle colors a row only after its flip animation, which Chrome skips in a
hidden tab, so keep the tab in front. Installed copies update only when the owner
updates them, so ask before testing a new version. Release steps: skill `release`.

## Where things live

| Topic (old CLAUDE.md section)            | Where                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Userscript engineering (checklist)       | `~/.claude/rules/userscripts.md`, `docs/agents/userscript-guidelines.md` |
| Deliberate exceptions to the checklist   | `.claude/rules/userscripts-local.md`                                     |
| Release, version bump, Greasy Fork check | skill `release` (manual: `/release`)                                     |
| Wordle word lists                        | `.claude/rules/wordle.md`                                                |
| Issue tracker, triage labels             | `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`           |
| Domain docs, changelog style             | `docs/agents/domain.md`, `docs/agents/changelog-guideline.md`            |
| Idea intake                              | below                                                                    |
| Code style                               | `pnpm format:check`                                                      |

Ideas: Idea Inbox is issue #1 (label `idea-inbox`); protocol in `docs/agents/idea-inbox.md`.
