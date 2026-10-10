# Wordle Shortlist

NYT Wordle with a nudge. You get a random starting word, then each turn a handful of words that could be the answer to choose from. It makes Wordle easy, but you still pick the word: the choices aren't all equally good, so it's on you to spot the better ones.

**Install:** [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/wordle/wordle-shortlist.user.js) · [Changelog](../CHANGELOG.md#wordle-shortlist)

## How it works

1. Install the script (see [Installing](../README.md#installing)) and open Wordle. Above the keyboard, the script suggests a starting word: any of the roughly 3,000 likely answers, picked at random, not a well-known good opener.
2. Tap it to play it, or type your own word as usual.
3. After each guess you get 5 picks, and every one of them could be the answer: no words that only narrow things down. Under each word is roughly how many answers would still be possible if it isn't the one (fewer is better). The line above the picks says how many answers still fit.
4. Tap a pick to play it. Anything you'd already typed is cleared first.
5. Once only one answer fits, it's the only pick. When the puzzle is over, a recap takes the picks' place: how many guesses it took, how often you played the best pick on offer, and the level.

The picks are drawn at random from the best possible answers, so some are better than others, and you won't get the same five as everyone else. With 5 or fewer answers left, you see all of them.

## Levels

Tap the level next to the starting word to switch it before your first guess. It's remembered for the next puzzles.

| Level | Picks come from | Hints |
| --- | --- | --- |
| Easy | the 10 best possible answers | shown |
| Medium (default) | the 30 best | shown |
| Hard | any possible answer | hidden, so picking well is up to you |

## Buttons

| Button | Does |
| --- | --- |
| 🎲 | Deal a different set of picks for this turn |
| ▾ | Tuck the picks away; tap **🎲 Shortlist** to bring them back |

## Good to know

- **Hard mode:** every pick fits all the colors so far, so the picks always follow hard mode's rules.
- **No spoilers:** the script never looks up the day's answer. It only knows the colors on your board, and a list of likely answers.
- Your picks are saved for each puzzle in your browser, so reloading the page doesn't deal new ones. Puzzles you haven't opened in 60 days are cleaned up.
- Works on archive puzzles too (`nytimes.com/games/wordle/YYYY-MM-DD`).
- On a short screen, the board shrinks a little to make room for the picks, so the keyboard stays in view.

## Word lists

The likely answers (about 3,000 words) are NYT WordleBot's list, as curated by [WordGamesBot](https://github.com/WordGamesBot/wordgamesbot.github.io). If the answer turns out not to be on it, the picks come from WordleBot's wider list of about 4,600 common words instead.

The lists change a few times a year. Once a month a GitHub Action checks for changes and, if there are any, opens a pull request with the new lists; merging it releases a new version. To update by hand, run `pnpm update-words`.

## Development

The script is a single file, [`wordle-shortlist.user.js`](wordle-shortlist.user.js), with no build step. Behavior tests load it into jsdom against a simulated Wordle board ([`test/`](test/)):

```sh
pnpm install
pnpm test
```

Report bugs and ideas in the [issues](https://github.com/dividedby/games-scripts/issues).
