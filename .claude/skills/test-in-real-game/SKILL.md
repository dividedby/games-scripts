---
name: test-in-real-game
description: Run a games-scripts userscript in the real NYT / Minute Cryptic game, on desktop Chrome or phone width. Use before calling a user-facing change done, or when jsdom tests pass but real behavior is in doubt.
---

# Testing in the real game

Fixtures, puzzles and the owner's own state:

- Use 2023 archive puzzles (`/games/connections/2023-MM-DD`, `/games/wordle/2023-MM-DD`):
  the owner won't replay them. Never play today's Wordle. Leave puzzles the owner opened
  for you unsolved and cleared afterwards unless asked.
- Connections answers: `/svc/connections/v2/YYYY-MM-DD.json` on nytimes.com.
- Minute Cryptic: never read `answer`, never solve the owner's daily (see CLAUDE.md).

Debug hooks:

- Connections Palette: set localStorage `ccm:debug` to `true` and reload to expose the
  palette's shadow root as `window.__ccmRoot`; remove it when done.
- Wordle Shortlist: `wsl:debug` exposes `window.__wslRoot` and `window.__wsl`.

Where to test:

- Desktop: the owner's Chrome tab group "Claude" (desktop and phone-width tabs). The
  phone-width tab doesn't take real clicks, so drive it from page JavaScript.
- Phone width without a phone: Chrome won't size a window below ~500px, but a 390px
  same-origin iframe of the game (`/games/wordle/2023-MM-DD`) gets phone media queries,
  the real page CSS and the installed script. The page's CSS overrides `padding` and
  `margin` on a script's host element, so put spacing inside the shadow root.
- Real iPhone or simulator: use the global `mobile-safari` skill (it replaced iPhone
  Mirroring); it also covers README phone screenshots.

Gotchas:

- Wordle only colors a row once its flip animation ends, and Chrome doesn't run
  animations in a hidden tab: test with the window in front.
- Installed copies update only after the owner updates them in Tampermonkey and the
  Userscripts app, so ask before testing a new version. To test an unreleased build,
  inject the raw file at its commit with `(0,eval)(src)` after renaming the installed
  copy's root (`#ccm-root`, `#wsl-root`, `#nytd-style`): each script exits if it finds
  its own root, so a second copy otherwise won't start. Two copies of NYT Games Dark
  interfere with each other; compare builds on a script-free `srcdoc` snapshot of the
  page instead.
