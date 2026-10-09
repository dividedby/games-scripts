# 0002 — Also published on Greasy Fork

## Status
Accepted (2026-10-08). Amends [0001](0001-self-hosted-updates-and-pre-1-versioning.md).

## Context
Connections Color Marker is now listed on Greasy Fork
(https://greasyfork.org/en/scripts/599362-connections-color-marker), where most people look for userscripts. 0001 assumed a move to Greasy Fork
would mean switching the update URLs. It doesn't: Greasy Fork strips `@updateURL`,
`@downloadURL` and `@installURL` from the copy it serves and points installs at its own
update URL.

## Decision
- Publish in **both** places. The GitHub file stays the source of truth and keeps its
  raw-URL `@downloadURL` / `@updateURL`, so existing GitHub installs keep updating from
  `main`. Greasy Fork installs update from Greasy Fork.
- The Greasy Fork listing's description lives in the repo next to the script
  (`connections/greasyfork-description.md`). Greasy Fork is set to sync both the script
  and this description from their raw URLs on `main`, so the repo is the only place to
  edit either.
- `@namespace` (the Greasy Fork user URL) never changes: Greasy Fork warns if it does,
  and managers use it with `@name` to recognise the installed script.

## Consequences
- A push to `main` reaches GitHub installs on their next update check, and Greasy Fork
  installs once Greasy Fork's sync picks up the new version (usually within a day; the
  owner can trigger it sooner from the listing's admin page).
- The README offers both install sources and tells people to pick one; installing from
  both would run the script twice.
