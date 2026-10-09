# Connections Color Marker

Mark each tile with the color you think it is, then submit the groups in the order you want. Built for going after the reverse rainbow (purple, blue, green, yellow), but works for any order.

**Install:** [Greasy Fork](https://greasyfork.org/en/scripts/599362-connections-color-marker) · [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/connections/connections-color-marker.user.js) · [Changelog](../CHANGELOG.md#connections-color-marker)

<p align="center">
  <img src="../docs/images/connections/desktop-board.png" alt="Desktop: tiles outlined in purple, blue, green and yellow, sorted into rows, with two tiles split between green and yellow, and the two-row palette below" width="560">
  &nbsp;
  <img src="../docs/images/connections/iphone-board.jpg" alt="iPhone: the same kind of board in Safari, with the one-row phone palette" width="196">
</p>

## Quick start

1. Install the script from [Greasy Fork](https://greasyfork.org/en/scripts/599362-connections-color-marker) or [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/connections/connections-color-marker.user.js) (see [Installing](../README.md#installing)) and open a Connections puzzle.
2. Select tiles in the game, then tap a color on the palette. They keep that color and get deselected.
3. When a color has 4 tiles, tap **Go ▶** to submit it. Go always picks the next color in your order (purple first by default).

## Marking

- Each color holds at most 4 tiles. ⌫ removes marks from the selected tiles, and ↶ undoes your last change (marking, erasing, swapping or clearing).
- A color is full? Select one of its tiles plus the one you want in, then tap the color: the two swap colors.
- With nothing selected, tap two colors to swap them everywhere ("my blue is really green").
- Once three colors are full, the last 4 tiles get the remaining color automatically.
- The sort button cycles **P→Y** (reverse rainbow), **Y→P** (rainbow) and **Off**. Each color gets its own row, and the game's Shuffle keeps your rows.

## Maybe colors (optional)

Not sure if a tile is yellow or green? Turn on **?** on the palette, select the tile and tap both colors. Its outline splits like a pie: half yellow, half green (a third each for three). Tap a color again to drop it; once one color is left, the tile is a normal mark again. Tapping a color with **?** off sets a single color as usual.

- Split tiles don't count toward Go, auto-fill or the 4-per-color limit.
- When a color is solved it drops out of every split, so a yellow-or-green tile becomes green once yellow is solved.
- While **?** is on, tiles hold still so they don't jump around as you add options. Turn **?** off and they move into place: after your color rows, with matching splits (every green-or-blue, say) side by side.
- A **dashed** outline means a tile's only remaining option is a color that's already full. Free up a spot or pick another color.

<details>
<summary>Screenshot: maybe mode</summary>
<br>
<img src="../docs/images/connections/desktop-maybe.png" alt="Maybe mode on: the color buttons have dashed borders, the ? button is filled, JUNK is split three ways and the selected CUBAN keeps its green and yellow split" width="560">
</details>

## Submitting

- **Go ▶** submits the next color in your sort order. It's tinted with that color, and dimmed until that color has exactly 4 tiles.
- To submit a different color, tap that color (nothing selected), then Go. Going out of order? Go turns red and asks **Sure?**; tap again within 4 seconds to submit anyway.
- You can still select tiles and press the game's own Submit; the script keeps up either way.

<details>
<summary>Screenshot: out-of-order warning</summary>
<br>
<img src="../docs/images/connections/palette-sure.png" alt="The palette with blue armed and the Go button turned red, reading Sure?" width="360">
</details>

## After guesses

- When a group is solved, your colors are corrected to match the game: if your "purple" turns out to be blue, purple and blue swap everywhere. Solved colors show ✓ on the palette.
- Optional: **One away** marks put a red letter (A, B, …) on the tiles of each guess the game called one away. Tiles that share a letter are worth a second look.
- Optional: **guess history**. 📜 lists your wrong guesses for the puzzle, with one-aways flagged, so a missed pop-up isn't lost. Re-entering a wrong guess reminds you whether it was one away (the game only says "Already guessed"). Wrong guesses are always recorded, so you can turn this on mid-puzzle.

<details>
<summary>Screenshot: one-away letters and guess history</summary>
<br>
<img src="../docs/images/connections/desktop-guesses.png" alt="Tiles from two one-away guesses marked with red A and B badges, and the 📜 list of three wrong guesses with two flagged one away" width="560">
</details>

## On your phone

The open palette is one row across the bottom of the screen: the colors, ⌫, ↶, **?**, Go and **⋯**. Tap **⋯** to swap the row for the rest (sort, 📜, ⚙ and hide), and **‹** to swap back. Before you press Play, and on the results screen, the palette stays tucked away as 🎨.

<details>
<summary>Screenshots: the ⋯ row and settings on iPhone</summary>
<br>
<img src="../docs/images/connections/iphone-more.jpg" alt="iPhone: the palette swapped to its other tools: sort, history, settings, hide and back" width="250">
&nbsp;
<img src="../docs/images/connections/iphone-settings.jpg" alt="iPhone: the settings panel open above the palette" width="250">
</details>

## Settings

Open ⚙ on the palette. Choices are saved in your browser.

| Setting | Default |
| --- | --- |
| Mark "One away" guesses | Off |
| Guess history (📜 list of wrong guesses) | Off |
| Maybe colors (**?** splits a tile between candidate colors) | Off |
| Auto-fill the last group | On |
| Fix my colors after a solve (off: only the solved tiles change) | On |
| Go button (off: marking only) | On |
| Ask before going out of order | On |
| Show color letters (Y/G/B/P on each mark and on the palette, for colorblind players) | Off |
| Keyboard shortcuts (desktop only) | On |
| Palette on the left | Off |

The panel also has **Clear this puzzle** and **Reset settings**.

<details>
<summary>Screenshots: settings panel and color letters</summary>
<br>
<img src="../docs/images/connections/desktop-settings.png" alt="Desktop: the settings panel open above the palette" width="560">
<br><br>
<img src="../docs/images/connections/desktop-letters.png" alt="Color letters on: each tile has a small Y, G, B or P badge, splits show both letters (YG, YGB), and the palette buttons read Y3, G3, B4, P4" width="560">
</details>

## Keyboard (desktop)

1–4 colors, 0 erase, Z undo, G go, Esc cancel. With maybe colors on: M toggles maybe mode, and Shift+1–4 adds or removes one option without it.

## Good to know

- Works with dark-mode extensions like Dark Reader: the marks keep their true colors and the palette turns dark.
- Marks are saved per puzzle in your browser, kept in sync across tabs, and cleared after 60 days without use.
- Archive puzzles work too (`nytimes.com/games/connections/YYYY-MM-DD`).

## Development

The script is a single file, [`connections-color-marker.user.js`](connections-color-marker.user.js), with no build step. Behavior tests load it into jsdom against a simulated Connections board ([`test/`](test/)):

```sh
pnpm install
pnpm test
```

The [Greasy Fork listing](greasyfork-description.md) text lives here too. Report bugs and ideas in the [issues](https://github.com/dividedby/games-scripts/issues).
