<h1>games-scripts</h1>

Userscripts for browser word and puzzle games, by dividedby. Each one adds to a game's own page in your browser; they work on desktop and on iPhone/iPad.

## Scripts

| Script | What it does | Install |
| --- | --- | --- |
| [**Connections Color Marker**](connections/README.md) | NYT Connections: mark each tile with the color you think it is, split unsure tiles between colors, and submit groups in your chosen order (built for the reverse rainbow). | [Greasy Fork](https://greasyfork.org/en/scripts/599362-connections-color-marker) · [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/connections/connections-color-marker.user.js) |

<p align="center">
  <a href="connections/README.md"><img src="docs/images/connections/desktop-board.png" alt="Connections Color Marker on desktop: tiles outlined in purple, blue, green and yellow, sorted into rows" width="440"></a>
</p>

## Installing

1. Get a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) on desktop, or the [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app for Safari on iPhone and iPad.
2. Install a script from either place in the table. Both carry the same version:
   - **Greasy Fork**: click **Install this script**. The easiest option, and where reviews and questions go.
   - **GitHub**: open the raw file and your manager offers to install it. New versions land here first.
3. Updates come from wherever you installed it: Greasy Fork installs update from Greasy Fork, GitHub installs from GitHub. Tampermonkey checks on its own; in the Userscripts app, use its update check. Install each script from only one place, or it will run twice.

## Development

No build step: each `*.user.js` file is the script itself. Tests run each script against a simulated copy of its game:

```sh
pnpm install
pnpm test
```

Changes are listed in the [changelog](CHANGELOG.md). Bugs and ideas go in the [issues](https://github.com/dividedby/games-scripts/issues).

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
