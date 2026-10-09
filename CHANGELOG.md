# Changelog

All notable changes to the userscripts in **games-scripts** are documented here,
one section per script.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions below 1.0.0 are pre-release.

## Connections Color Marker

### [Unreleased]

### [0.7.1] - 2026-10-08
#### Fixed
- With sorting on, split tiles stay together in a row after your colors instead of being scattered across the board.

### [0.7.0] - 2026-10-08
#### Changed
- Maybe colors split the tile's outline like a pie instead of adding corner dots: yellow-or-green is half yellow, half green; three options get a third each. A tile is either decided (one color) or split; only decided tiles count toward Go, auto-fill and the 4-per-color limit. With **?** on, tapping a color adds it to or removes it from the selected tiles' options; down to one option, the tile is decided again.
- When a color is solved it drops out of every split, so a yellow-or-green tile becomes green once yellow is solved.
- Maybe dots saved by 0.6 become splits.
- The open palette has two rows: the colors and Go on top, the tools below. On phones it stays one row (colors, ⌫, ↶, ?, Go), with sort, 📜, ⚙ and hide behind **⋯**.

### [0.6.2] - 2026-10-08
#### Fixed
- ⌫ on tiles that only have maybe dots now clears them, instead of appearing to do nothing.
- The **?** button is filled in while maybe mode is on, so it's harder to forget it's active.
- On phones, the open palette is one full-width row instead of wrapping a lone ▾ onto a second row over the game's Shuffle/Submit buttons.
- Maybe dots are a little larger with a darker outline, so light blue and yellow show on the cream tiles.

### [0.6.1] - 2026-10-08
#### Fixed
- The settings panel had grown taller than a laptop screen; descriptions are now one line each, with the full explanation on hover.

### [0.6.0] - 2026-10-08
#### Added
- Maybe colors setting: with **?** on, tapping colors adds small "maybe" dots to the selected tiles, several per tile, on top of the main mark. They don't count toward Go, auto-fill or the 4-per-color limit, follow swaps and undo, and drop out once a color is solved. Keys: M for maybe mode, Shift+1–4 for a single maybe. Off by default.

#### Changed
- The palette wraps onto a second row when it would be wider than the screen.

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
