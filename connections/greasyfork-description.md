<!--
GreasyFork listing description for Connections Color Marker. Greasy Fork syncs this
file from main automatically (along with the script), so edit it here, not on the site.
GreasyFork renders Markdown. Keep links and image URLs absolute —
relative ones won't resolve there. Images use <img width> to stay small (Markdown
images render full size); GreasyFork allows img width/height, <center> and <details>.
The full README (with every setting and the dev/test info) lives on GitHub.
-->

Color-code the tiles in **NYT Connections** as you work out the groups, then submit
them in whatever order you like. It's especially handy if you go for a **reverse
rainbow**: solving the hardest group (purple) first and the easiest (yellow) last.
Works on desktop, iPhone and Android.

<center>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/desktop-board.png" alt="Desktop: tiles outlined in purple, blue, green and yellow, sorted into rows, with the palette below" width="460">
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/iphone-board.jpg" alt="iPhone: the same kind of board in Safari, with the one-row phone palette" width="160">
</center>

**New in 0.7**

- **Maybe colors**: torn between two colors? The tile's outline splits between
  them, half yellow and half green, for example (or in thirds for three). Split
  tiles don't count toward a color's 4, and once a color is solved it drops out of
  every split.
- Tiles stay put while you're adding maybe colors, then tiles with the same
  colors are grouped together.
- New palette layout: colors and Go on top, other buttons below. On phones it's
  a single row, with the extra buttons behind **⋯**.
- After an out-of-order **Sure?** runs out, Go ignores taps for a moment, so a
  late tap can't submit the wrong group.

**What it does**

- Select tiles as usual, then tap a color on the palette. The tiles get an
  outline in that color and are deselected, ready for the next group. Up to 4
  tiles per color; ↶ undoes.
- Each color gets its own row, in reverse rainbow order (purple, blue, green,
  yellow) by default. One tap switches to rainbow order or turns sorting off.
  The game's Shuffle won't break up your rows.
- **Go ▶** submits your colors in that same order, and asks **Sure?** if you
  try to skip ahead.
- Once three colors have 4 tiles, the last 4 get the remaining color.
- Swap two whole colors, or trade a tile into a full color, with a couple of taps.
- After each solve, your colors are corrected: if your "purple" tiles were
  really the blue group, purple and blue swap everywhere.

**Optional** (all off by default, in ⚙)

- **Maybe colors**: split a tile between the colors you're unsure about (see above).
- **Guess history**: the 📜 button lists your wrong guesses and flags the ones
  that were one away.
- **One away letters**: red letters on the tiles of each guess the game called
  one away, so overlaps stand out.
- **Color letters** (Y/G/B/P) on every tile, for colorblind players.

<details>
<summary>More screenshots</summary>

<center>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/desktop-maybe.png" alt="Maybe mode: dashed color buttons, a tile split three ways and a selected tile split two ways" width="460">
<br><br>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/desktop-solved.png" alt="Purple and blue solved, green and yellow still in their rows, checkmarks on the palette" width="400">
<br><br>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/desktop-guesses.png" alt="One-away letters on tiles and the list of wrong guesses" width="460">
<br><br>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/desktop-settings.png" alt="The settings panel open above the palette" width="460">
<br><br>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/iphone-more.jpg" alt="iPhone: the palette swapped to sort, history, settings and hide" width="200">
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/connections/iphone-settings.jpg" alt="iPhone: the settings panel" width="200">
</center>
</details>

Keyboard shortcuts on desktop (1–4, 0, Z, G, Esc). Works with dark-mode
extensions like Dark Reader. Your colors are saved for each puzzle in your
browser, so you can close the tab and come back. Archive puzzles work too.

**Install:** get a userscript manager, then click **Install** above.

- **Chrome, Edge, Brave:** [Tampermonkey](https://www.tampermonkey.net/). In Chrome,
  also turn on **Allow user scripts** on Tampermonkey's details page.
- **Firefox, on desktop or Android:**
  [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) or
  [Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/).
- **Safari on iPhone, iPad or Mac:** the
  [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app.

A full guide with every setting, more screenshots and the changelog is on
[GitHub](https://github.com/dividedby/games-scripts/tree/main/connections#readme),
where you can also report issues. Licensed GPL v3 or later.
