# Changelog

All notable changes to the userscripts in **games-scripts** are documented here,
one section per script.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions below 1.0.0 are pre-release.

## Connections Color Marker

### [Unreleased]

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
