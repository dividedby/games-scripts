---
name: release
description: Cut a release of a games-scripts userscript. Bump @version, roll the script's CHANGELOG Unreleased entries into a dated section, merge to main, and check Greasy Fork picked it up. Manual only.
disable-model-invocation: true
---

# Release a userscript

Pushing to `main` is the release: GitHub installs update from the raw URL, and Greasy
Fork syncs the script and its `greasyfork-description.md` from `main` on its own.
Unfinished work stays on a branch.

1. `@version` in the script header: past 1.0, new capability → minor, fix → patch. Minute
   Cryptic Plus stays 0.x until the owner calls it ready. Never touch `@namespace`,
   `@updateURL` or `@downloadURL`, and never move or rename the `.user.js` file.
2. `<script folder>/CHANGELOG.md`: roll its `## [Unreleased]` entries into a new
   `## [x.y.z] - YYYY-MM-DD` section (typed `###` headings: Added, Changed, Fixed, ...)
   and leave a fresh empty `## [Unreleased]` above it. The root `CHANGELOG.md` only holds
   changes that apply to every script. Style: `docs/agents/changelog-guideline.md`.
3. Check the script's `README.md` and `greasyfork-description.md` ("New in" section)
   match the new behavior.
4. `pnpm test` and `pnpm format:check` pass; the change has run in the real game
   (CLAUDE.md, Definition of done).
5. Merge via the usual PR flow (`~/.claude/branching-flow.md`).
6. Greasy Fork can lag `main` by a day or more. Check the version it serves at
   `greasyfork.org/en/scripts/<id>.json` (Connections 599362, Wordle 599505,
   Dark 599796). Installed copies update only after the owner updates them in
   Tampermonkey and the Userscripts app.
