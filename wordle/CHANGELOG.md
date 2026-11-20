# Changelog: Wordle Shortlist

All notable changes to **Wordle Shortlist** (`wordle/`, part of **games-scripts**) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions below 1.0.0 are pre-release.

## [Unreleased]

## [1.1.0] - 2026-10-16

### Added

- Each level has its own start: Easy gives one of the 10 best openers (with its hint), Medium any likely answer as before, and Hard a choice of five random words from the whole guess list (about 4,600 words), not just the likely answers. Switching level before the first guess deals that level's start, and an Easy start you play counts toward the recap's easiest level.

### Changed

- Hard no longer shows how many answers are left, on the line above the picks or as "only fit", and Medium's start word no longer shows a hint.

## [1.0.2] - 2026-10-13

### Fixed

- A damaged saved shortlist (or level) is ignored and a fresh one dealt, and the picks are built as plain text, never as page markup.
- The shortlist is only redrawn when something in it changed, not on every change to the page; resizing the window no longer piles up refits.
- A second copy of the script does nothing, and the console says once if the game's board or keyboard can't be found.

## [1.0.1] - 2026-10-11

### Fixed

- With a dark-mode extension like Dark Reader or Noir, the shortlist was dark text on a dark page; it now switches to light text whenever the page behind it is dark.

## [1.0.0] - 2026-10-10

### Fixed

- The shortlist was nearly invisible in Wordle's dark theme; it now uses the game's own text color.
- Tapping picks quickly could briefly re-enable the buttons while a word was still being entered; the level button is now also locked during entry.
- A tab left open on today's puzzle past midnight could mix two days into one recap.
- Button outlines show on iPhones and iPads older than iOS 16.2.

## [0.1.0] - 2026-10-09

### Added

- First version: a starting word picked at random from the likely answers, then 5 picks each turn, all possible answers, each with roughly how many answers it would leave. Tap a pick to play it; 🎲 deals new picks; ▾ tucks them away. The picks always fit hard mode, the script never looks up the answer, and the board shrinks on short screens so the keyboard stays in view.
- Levels, switchable any time: Easy (picks from the best 10, with hints), Medium (the best 30, with hints) and Hard (any possible answer, no hints).
- A line above the picks with how many answers still fit, and a recap when the puzzle is over: guesses, how often you played the best pick, and the easiest level used.
