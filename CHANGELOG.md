# Changelog

All notable changes to the userscripts in **games-scripts** are documented here,
one section per script.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions below 1.0.0 are pre-release.

## Connections Color Marker

### [Unreleased]

### [0.5.0] - 2026-10-08
#### Added
- Guess history setting: 📜 on the palette lists your wrong guesses for the puzzle with one-aways flagged, and re-entering one reminds you whether it was one away. Off by default.

#### Changed
- Wrong guesses are now remembered whether or not the "One away" marks are on, so turning either setting on mid-puzzle shows what you've already tried.

### [0.4.0] - 2026-10-08
#### Changed
- Marked tiles show only the colored outline; the small corner dot now appears only when "Show color letters" is on, carrying the letter.

### [0.3.2] - 2026-10-08
#### Fixed
- The settings panel is now the intended width, so it fits narrow phones.
- On phones, the tucked-away 🎨 button sits higher off the board so it no longer covers NYT's buttons and banners.
- Today's puzzle left open past midnight keeps saving to its own day.
- Two tabs open on the same puzzle stay in sync.

### [0.3.1] - 2026-10-08
#### Fixed
- Full colors on the palette are no longer dimmed, and solved ones are easier to read, especially in dark mode.

### [0.3.0] - 2026-10-08
#### Added
- Undo (↶ or Z) reverses your last color change.
- "Show color letters" setting puts Y/G/B/P on each mark and on the palette, so the colors can be told apart without color.
- Dark theme for the palette and settings when a dark-mode extension like Dark Reader is on.

#### Fixed
- Dark-mode extensions like Dark Reader no longer darken the marks and palette colors (blue was nearly invisible).
- The script now only reacts to changes in the game itself, not the rest of the page.

### [0.2.1] - 2026-10-08
#### Fixed
- When an out-of-order "Sure?" times out, the color you picked is let go too, so tapping it again picks it instead of cancelling it.
- The ⚙ settings icon was hard to see; it's now larger.

### [0.2.0] - 2026-10-08
#### Added
- Settings panel (⚙ on the palette) to turn features on or off: "One away" marks, auto-fill, fixing colors after a solve, the Go button, the out-of-order check, keyboard shortcuts, and which side the palette sits on. Choices are saved in your browser.

#### Changed
- "One away" marks are now off by default; turn them on in settings.
- Clear moved from the palette into the settings panel, next to a new Reset settings.

### [0.1.0] - 2026-10-08
#### Added
- Mark tiles with yellow, green, blue or purple from a floating palette; at most 4 tiles per color.
- Swap two colors everywhere, or exchange a tile into a full color with one tap.
- Auto-fill the last 4 tiles once three colors are complete.
- Go submits the next color in sort order, tinted with that color; out-of-order submits ask "Sure?" first.
- Solved groups correct your colors to the game's, and solved colors show ✓.
- "One away" guesses mark their tiles with letter badges.
- Sort rows by reverse rainbow, rainbow or not at all; Shuffle keeps the grouping.
- Palette stays collapsed until the puzzle board is showing, sized for phones.
- Keyboard shortcuts on desktop, and marks saved per puzzle with automatic cleanup.
