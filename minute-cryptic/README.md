# Minute Cryptic Plus

Two things for [Minute Cryptic](https://www.minutecryptic.com) in the browser, mostly for playing on a phone:

- **Your phone's own keyboard** instead of the game's on-screen one.
- **A quicker scribble space**: shuffle the letters right in the boxes, send them all into a circle with one tap, and put them back in the boxes with another.

It never looks at the answer and gives no hints: it only moves the letters you've typed.

**Install:** [GitHub](https://raw.githubusercontent.com/dividedby/games-scripts/main/minute-cryptic/minute-cryptic-plus.user.js) (see [Installing](../README.md#installing)) · [Changelog](../CHANGELOG.md#minute-cryptic-plus)

## Your own keyboard

The game's keyboard is hidden. Tap any answer box and your phone's keyboard comes up instead: type letters, Backspace to delete, and **Done** to close it. Autocorrect and suggestions stay out of the way.

A **⌨** button next to **check** switches back to the game's keyboard (and back again). Your choice is remembered.

## Scribble space

Open the scribble space as usual. The game's buttons do a bit more:

| Button | What it does |
| --- | --- |
| **Shuffle** (the game's) | Shuffles the loose letters, as before, **and** the letters in the answer boxes, in place. |
| **Circle** (the game's) | If there are letters in the answer boxes, takes them all out and lays them out in a shuffled circle, in one tap. With nothing in the boxes, it's the game's own Circle. |
| **⤓** (new, next to Shuffle) | Puts the loose letters back into the empty answer boxes: round the circle clockwise from the top, or row by row in Grid layout. |

Letters a hint has revealed always stay where they are, and letters already in a box stay too. If there are more loose letters than empty boxes, the rest stay loose.

## If it stops working

The scribble space extras use the game's own controls for it, which aren't a public feature and could change when the site is updated. If that happens they do nothing (the browser console says so once) and the game's buttons work as they always have. The keyboard keeps working as long as the game takes letters from a keyboard. Please [open an issue](https://github.com/dividedby/games-scripts/issues) if something's off.

## Development

The script is [`minute-cryptic-plus.user.js`](minute-cryptic-plus.user.js); `pnpm test` runs [`test/`](test/) against a simulated page and scribble space.
