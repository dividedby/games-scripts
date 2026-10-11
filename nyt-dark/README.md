# NYT Games Dark

A proper dark mode for NYT Games in the browser.

The NYT Games app has a dark mode; the website doesn't, so on the web you're stuck with a bright page or a dark-mode extension like Dark Reader or Noir. Those extensions guess at every color, and puzzle colors suffer: in Connections, the blue group ends up the same gray as an unsolved tile.

It turns out the website already ships NYT's dark colors for the games themselves (the same ones the app uses). It just never switches them on. This script does, so game colors stay exactly as NYT designed them. The older parts of the site never got dark colors (the top bar, the ☰ menu, Wordle's start screen, white promo cards), so the script darkens those itself.

**Install:** [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/nyt-dark/nyt-games-dark.user.js) · [Changelog](../CHANGELOG.md#nyt-games-dark)

## How it works

1. Install the script (see [Installing](../README.md#installing)) and open any NYT game.
2. By default it follows your device: dark when your phone or computer is in dark mode, light otherwise.
3. Tap **◐ Auto** in the top bar, next to the Games logo, to switch between **Auto**, **Dark** (always) and **Light** (always). Your choice is remembered across the games.

**Using a dark-mode extension?** Dark Reader steps aside on its own: the script tells it the page is already dark. Noir (Safari on iPhone and iPad) doesn't, so turn Noir off for nytimes.com, or the page gets darkened twice and the colors go off again.

## What's covered

- **Connections**: the board, selected tiles, solved groups in their real colors, and the results screen.
- **Wordle**: the board and keyboard. (Wordle also has its own Dark Theme in its settings; either works.)
- **The ☰ menu, the top bar, start screens and results screens.** Colorful start screens (Connections' purple, for example) keep their color; plain white or gray ones turn dark.
- **The Games home page**: the background and top bar. The white puzzle cards there stay white for now.

Other games use the same color set, so they should look right too, but they haven't all been checked yet.

Wordle's own page has no top bar, so set the mode from another game or the Games home page; it carries over.

## Development

The script is a single file, [`nyt-games-dark.user.js`](nyt-games-dark.user.js), with no build step. Behavior tests run it in jsdom ([`test/`](test/)):

```sh
pnpm install
pnpm test
```

Report bugs and pages that still look wrong in the [issues](https://github.com/dividedby/games-scripts/issues).
