<!--
GreasyFork listing description for Wordle Shortlist. Once the listing is set to sync from
main, Greasy Fork pulls this file automatically (along with the script), so edit it
here, not on the site. GreasyFork renders Markdown. Keep links and image URLs absolute —
relative ones won't resolve there. Images use <img width> to stay small; GreasyFork
allows img width/height, <center> and <details>.
The full README (with the dev/test info) lives on GitHub.
-->

For people who want to have played **NYT Wordle** today without really playing Wordle.

You get a random starting word (not CRANE, not SLATE, just whatever comes up), then
each turn a shortlist of five words that could be the answer. Tap one. That's the job.
It's easy, but it isn't autopilot: the five aren't equally good, so there's still a
right call to make. Works on desktop, iPhone and Android.

<center>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/wordle/desktop-board.png" alt="Wordle after HIJAB and SNORE: '25 possible answers · Medium' and a shortlist of DROOL, FLOOR, GROWL, ROOMY and FROCK above the keyboard" width="340">
</center>

**What it does**

- A **starting word** picked at random from about 3,000 likely answers. Some days
  it's a decent opener. Some days it's HIJAB.
- After each guess, **five picks**, every one a possible answer, so you're always
  playing by hard mode's rules. Each shows roughly how many answers would be left
  if it isn't the one; the line above shows how many still fit.
- **Tap a pick** to play it. 🎲 deals a different five, ▾ tucks them away.
- When the puzzle's over, a **recap**: guesses, how often you played the best pick
  on offer, and the level.

**Levels** (tap the level above the picks to switch, any time)

- **Easy**: picks from the 10 best possible answers, with hints.
- **Medium** (default): the 30 best, with hints.
- **Hard**: any possible answer, no hints. You're on your own.

The recap names the easiest level you used, so dropping to Easy for one turn shows.

<details>
<summary>More screenshots</summary>

<center>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/wordle/hard-strip.png" alt="The same turn on Hard: TROMP, DROOL, GROOM, VROOM and CROCK, with no hints" width="460">
<br><br>
<img src="https://raw.githubusercontent.com/dividedby/games-scripts/main/docs/images/wordle/desktop-recap.png" alt="The finished board with 'Solved in 4 · best pick 1 of 2 · Medium' below it" width="260">
</center>
</details>

**No spoilers:** the script never looks up the day's answer; it only knows the colors
on your board and NYT WordleBot's list of likely answers. Your shortlist is saved per
puzzle, so reloading doesn't deal a new one. Archive puzzles work too.

**Install:** use [Tampermonkey](https://www.tampermonkey.net/) in Chrome, Edge or
Brave, Tampermonkey or Violentmonkey in Firefox (desktop or Android), or the
[Userscripts](https://apps.apple.com/app/userscripts/id1463298887) app for Safari on
iPhone, iPad or Mac, then click **Install** above.

The full guide and changelog are on
[GitHub](https://github.com/dividedby/games-scripts/tree/main/wordle#readme), where you
can also report issues. Word lists from NYT WordleBot via
[WordGamesBot](https://github.com/WordGamesBot/wordgamesbot.github.io). Licensed GPL v3
or later.
