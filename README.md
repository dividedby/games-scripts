<h1>games-scripts</h1>

Userscripts for browser word and puzzle games.

| Script | Game | Install |
| --- | --- | --- |
| [Connections Color Marker](#connections-color-marker) | NYT Connections | [Install](https://raw.githubusercontent.com/dividedby/games-scripts/main/connections/connections-color-marker.user.js) |

Install with [Tampermonkey](https://www.tampermonkey.net/) (desktop) or the [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app (Safari on iPhone/iPad). Installed scripts pick up new versions from this repo (Tampermonkey checks on its own; in Userscripts, use its update check).

## Connections Color Marker

Mark each tile with the color you think it is, then submit the groups in the order you want. Built for going after the reverse rainbow (purple, blue, green, yellow), but works for any order.

**Marking**
- Select tiles in the game, then tap a color on the palette. The tiles keep that color and get deselected.
- ⌫ removes marks from the selected tiles. Each color holds at most 4 tiles.
- ↶ undoes your last color change (marking, erasing, swapping, exchanging or clearing).
- A color is full? Select one of its tiles plus the one you want in, then tap the color: the two swap colors.
- With nothing selected, tap two colors to swap them everywhere.
- Once three colors have 4 tiles, the last 4 get the remaining color automatically.
- Optional (off by default): **maybe colors**. Not sure if a tile is yellow or green? Turn on **?** on the palette, select it and tap both: its outline splits like a pie, half yellow and half green (a third each for three). Tap a color again to drop it; down to one color, the tile is decided. Split tiles don't count toward Go, auto-fill or the 4-per-color limit, and a solved color drops out of every split (yellow-or-green becomes green once yellow is solved).

**Submitting**
- **Go ▶** submits the next color in your sort order. It's tinted with that color, and dimmed if that color doesn't have exactly 4 tiles.
- To submit a different color, tap it (nothing selected), then Go. Out of order? Go turns red and asks **Sure?**; tap again to submit anyway.

**After guesses**
- When a group is solved, your colors are corrected to match the game: if your "purple" turns out to be blue, purple and blue swap everywhere.
- Solved colors show ✓.
- Optional (off by default): a guess the game calls **One away** puts a red letter (A, B, …) on its tiles. Tiles that share letters are worth a second look.
- Optional (off by default): **guess history**. 📜 on the palette lists your wrong guesses for the puzzle, with one-aways flagged, so a missed "One away" pop-up isn't lost. Re-entering a wrong guess reminds you whether it was one away (the game only says "Already guessed").

**Layout**
- The sort button cycles **P→Y** (reverse rainbow), **Y→P** (rainbow) and **Off**. Each color gets its own row; Shuffle still works.
- The open palette has the colors and Go on top and the tools below. On phones it's one row across the bottom; **⋯** shows sort, 📜, ⚙ and hide.
- The palette stays tucked away (🎨) until the board is on screen. ▾ hides it, 🎨 brings it back.
- Keys on desktop: 1–4 colors, 0 erase, Z undo, G go, Esc cancel. With maybe colors on: M toggles maybe mode, Shift+1–4 adds or removes an option.
- Works with dark-mode extensions like Dark Reader: the marks keep their true colors and the palette turns dark.

**Settings (⚙ on the palette)**

| Setting | Default |
| --- | --- |
| Mark "One away" guesses | Off |
| Guess history (📜 list of wrong guesses) | Off |
| Maybe colors (? splits a tile between candidate colors) | Off |
| Auto-fill the last group | On |
| Fix my colors after a solve (off: only the solved tiles change) | On |
| Go button (off: marking only) | On |
| Ask before going out of order | On |
| Show color letters (a Y/G/B/P dot on each mark and letters on the palette, for colorblind players) | Off |
| Keyboard shortcuts | On |
| Palette on the left | Off |

The settings panel also has **Clear this puzzle** and **Reset settings**.

Marks are saved per puzzle in your browser and cleared after 60 days without use.

## Development

Tests run the script against a simulated Connections board:

```sh
pnpm install
pnpm test
```

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
