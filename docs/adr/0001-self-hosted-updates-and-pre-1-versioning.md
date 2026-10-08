# 0001 — Scripts update from this repo; versions start at 0.1.0

## Status
Accepted (2026-10-08)

## Context
The scripts run in Tampermonkey (desktop Chrome) and the Userscripts app (Safari on
iPhone). Pasting each new version by hand into both is slow and error-prone, and the
userscript managers will update a script themselves when its header points at a
download location and the version number goes up.

## Decision
- Each script's header carries `@downloadURL` and `@updateURL` pointing at its raw
  file on `main` (`https://raw.githubusercontent.com/dividedby/games-scripts/main/<path>`).
  The file path is therefore part of the public install URL: **never move or rename a
  published script file.**
- **Every change that should reach installed copies bumps `@version`.** Managers only
  update when the number is higher; an unchanged version means the change never
  arrives.
- Versions start at **0.1.0** and stay below 1.0.0 until the owner says a script is
  ready to release; that release becomes **1.0.0**. Before 1.0: new capability → minor
  (0.2.0), fix → patch (0.1.1).
- Public metadata names only the owner's online handle, **dividedby** (and variations
  of it). Never a real name or personal email address, in code, headers, docs, or
  commit authorship (commits use the GitHub no-reply address).

## Consequences
- Pushing to `main` is releasing: installed copies pick the change up on their next
  update check. Anything not ready goes on a branch.
- Moving to GreasyFork later would mean switching the update URLs, as the other
  dividedby userscripts do.
