<!--
GreasyFork listing description for NYT Games Dark
(https://greasyfork.org/en/scripts/599796-nyt-games-dark). Greasy Fork syncs this file from main
automatically (along with the script), so edit it here, not on the site. GreasyFork
renders Markdown. Keep links and image URLs absolute — relative ones won't resolve there.
Images use <img width> to stay small; GreasyFork allows img width/height, <center> and
<details>. The full README (with the dev/test info) lives on GitHub.
-->

A proper **dark mode for NYT Games** in the browser: Connections, Wordle, Strands,
Spelling Bee, the Crossword and the rest.

The NYT Games app has a dark mode; the website doesn't. Dark-mode extensions like Dark
Reader or Noir guess at every color, and puzzle colors suffer: in Connections, the blue
group turns the same gray as an unsolved tile. The website already ships NYT's own dark
colors for the games (the ones the app uses) and just never switches them on. This
script does, so game colors stay exactly as NYT designed them, and it darkens the parts
of the site NYT never gave dark colors.

<center>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/nyt-dark/desktop-and-iphone.png" alt="Desktop: a solved Connections puzzle on a dark page in NYT's own group colors. iPhone: the Games home page in dark" width="560">
</center>

**What it covers**

- **Every game**, with its menus, pop-ups (How to Play, settings, stats, hints) and
  results screens. Game colors stay NYT's own.
- **The crossword grid**: dark squares with light letters, the current word in deep
  blue, the selected square still yellow, like the app.
- **The ☰ menu, the top bar, start screens, the Games home page, archives, stats and
  the footer.** Colorful start screens and game cards keep their color.
- **Hints and bots**: Connections Companion, Spelling Bee Forum, Wordle Review and
  Wordplay (comments too), Wordle Bot and Connections Bot, and the NYT Help Center.

**How to use it:** it follows your device's dark mode. Tap **◐ Auto** in the top bar,
next to the Games logo, for **Dark** (always) or **Light** (always); your choice carries
across the games.

**Using a dark-mode extension?** Dark Reader steps aside on its own. Noir (Safari on
iPhone and iPad) doesn't, so turn Noir off for nytimes.com, or the page gets darkened
twice.

<details>
<summary>More screenshots</summary>

<center>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/nyt-dark/desktop-home.png" alt="The Games home page in dark, colorful game covers kept" width="520">
</center>
</details>

**Install:** use [Tampermonkey](https://www.tampermonkey.net/) in Chrome, Edge or
Brave, Tampermonkey or Violentmonkey in Firefox (desktop or Android), or the
[Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app for Safari on
iPhone, iPad or Mac, then click **Install** above.

The full guide and changelog are on
[GitHub](https://github.com/dividedby/games-scripts/tree/main/nyt-dark#readme), where you
can also report issues. Licensed GPL v3 or later.

Find it useful? You can [send a tip via PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=dividedbygit@gmail.com&item_name=NYT+Games+Dark+Donation). Thank you!
