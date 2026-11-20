# Changelog: NYT Games Dark

All notable changes to **NYT Games Dark** (`nyt-dark/`, part of **games-scripts**) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions below 1.0.0 are pre-release.

## [Unreleased]

## [1.1.1] - 2026-10-16

### Fixed

- On the Games home page when logged out, the lock on each puzzle card was invisible in dark (black on a dark circle). The circle is light again, so the lock shows.

## [1.1.0] - 2026-10-16

### Added

- The ◐ toggle is now in Wordle's toolbar too, next to ⚙ (just Auto, Dark or Light on a phone), so the mode can be switched without leaving Wordle.

### Fixed

- Links in the dark top bar, like Upgrade subscription, were black on black: invisible but still clickable. They're now light, outline included.
- Tapping the toggle in the top bar did nothing on iPhone; it now switches the mode.

## [1.0.1] - 2026-10-13

### Fixed

- Lighter on hint, forum and bot pages: as the page loads more, only the new parts are looked at instead of the whole page, and each look reads the page's colors before changing any.
- A mode saved by another tab is checked before use (anything unknown means Auto), and a second copy of the script does nothing.

## [1.0.0] - 2026-10-11

### Added

- First version: switches on NYT's own dark colors on the Games website (the ones the app uses) and darkens the parts of the site NYT never gave dark colors: the top bar, the ☰ menu, the page background, Wordle's start screen, white promo cards, the Games home page, the puzzle archives, the stats page and the footer. The crossword grid gets dark squares too, like the NYT app. Also darkens the hint and forum pages, Wordle Bot and Connections Bot, and the Help Center. Follows your device's dark mode, or tap ◐ in the top bar for always dark or always light. Tells Dark Reader to stand back so the page isn't darkened twice (Noir needs turning off for nytimes.com).
