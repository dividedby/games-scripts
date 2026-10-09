<!--
GreasyFork listing description for Connections Color Marker. Paste into the script's
"Description" field. GreasyFork renders Markdown. Keep links and image URLs absolute —
relative ones won't resolve there. If GreasyFork won't show the GitHub-hosted images,
upload the same files from docs/images/connections/ as the listing's screenshots instead.
The full README (with every setting and the dev/test info) lives on GitHub.
-->

Mark every tile in **NYT Connections** with the color you think it is, then submit
the groups in the order you want. Built for going after the reverse rainbow
(purple, blue, green, yellow), but works for any order. Desktop and iPhone.

![Tiles outlined in purple, blue, green and yellow, sorted into rows, with the palette below](https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/desktop-board.png)

**New in 0.7**

- **Maybe colors** split a tile's outline like a pie when you're torn between
  colors: half yellow, half green (a third each for three). Splits don't count
  toward Go or the 4-per-color limit, and a solved color drops out of every split.
- Tiles hold still while you're adding maybe colors, and matching splits sit side
  by side afterwards.
- New palette layout: colors and Go on top, tools below; one row on phones, with
  the rest behind **⋯**.
- Go waits a moment after an out-of-order **Sure?** runs out, so a late tap can't
  submit the wrong group.

**What it does**

- Select tiles, tap a color on the palette: they keep that color and get
  deselected. At most 4 tiles per color; ↶ undoes.
- Swap two colors everywhere, or trade a tile into a full color, in one tap.
- Once three colors are full, the last 4 tiles get the last color.
- Rows are sorted by color (reverse rainbow, rainbow or off), and the game's
  Shuffle keeps them.
- **Go ▶** submits the next color in your order, and asks **Sure?** before you go
  out of order.
- After each solve your colors are corrected: if your "purple" was really blue,
  the two swap everywhere.

**Optional** (all off by default, in ⚙)

- **Maybe colors**: several candidate colors per tile, as described above.
- **Guess history**: 📜 lists your wrong guesses, with one-aways flagged.
- **One away** letters on the tiles of each one-away guess.
- **Color letters** (Y/G/B/P) for colorblind players.

![iPhone: the board in Safari with the one-row phone palette](https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/iphone-board.jpg)

Keyboard shortcuts on desktop (1–4, 0, Z, G, Esc). Works with dark-mode
extensions like Dark Reader. Marks are saved per puzzle in your browser and kept
in sync across tabs. Archive puzzles work too.

**Install:** use [Tampermonkey](https://www.tampermonkey.net/) (or another
userscript manager) on desktop, or the
[Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app for Safari
on iPhone and iPad, then click **Install** above.

More screenshots, every setting and the full changelog are on
[GitHub](https://github.com/dividedby/games-scripts#connections-color-marker),
where you can also report issues. Licensed GPL v3 or later.
