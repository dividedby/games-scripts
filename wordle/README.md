# Wordle Guess Picks

NYT Wordle with a nudge. You get a random starting word, then each turn a handful of good guesses to choose from. It makes Wordle easy, but you still pick the word: the choices aren't all equally good, so it's on you to spot the better ones.

**Install:** [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/wordle/wordle-guess-picks.user.js) · [Changelog](../CHANGELOG.md#wordle-guess-picks)

## How it works

1. Install the script (see [Installing](../README.md#installing)) and open Wordle. Above the keyboard, the script suggests a random starting word from the likely answers.
2. Tap it to play it, or type your own word as usual.
3. After each guess you get 5 picks. Under each word is roughly how many answers would still be possible after playing it (fewer is better). A green dot means the word could be the answer itself.
4. Tap a pick to play it. Anything you'd already typed is cleared first.
5. Once only one answer fits, it's the only pick. When the puzzle is solved, the picks go away.

The picks are drawn at random from the best 30 guesses, so some are better than others, and you won't get the same five as everyone else.

## Buttons

| Button | Does |
| --- | --- |
| 🎲 | Deal a different set of picks for this turn |
| ▾ | Tuck the picks away; tap **🎲 Picks** to bring them back |

## Good to know

- **Hard mode:** if you play in hard mode, every pick follows the hints you've uncovered.
- **No spoilers:** the script never looks up the day's answer. It only knows the colors on your board, and a list of likely answers.
- Your picks are saved for each puzzle in your browser, so reloading the page doesn't deal new ones. Puzzles you haven't opened in 60 days are cleaned up.
- Works on archive puzzles too (`nytimes.com/games/wordle/YYYY-MM-DD`).
- On a short screen, the board shrinks a little to make room for the picks, so the keyboard stays in view.

## Word lists

The likely answers (about 3,000 words) and the guesses the picks come from (about 4,600 common words) are NYT WordleBot's lists, as curated by [WordGamesBot](https://github.com/WordGamesBot/wordgamesbot.github.io). If the answer turns out not to be on the list, the picks fall back to the wider guess list.

## Development

The script is a single file, [`wordle-guess-picks.user.js`](wordle-guess-picks.user.js), with no build step. Behavior tests load it into jsdom against a simulated Wordle board ([`test/`](test/)):

```sh
pnpm install
pnpm test
```

Report bugs and ideas in the [issues](https://github.com/dividedby/games-scripts/issues).
