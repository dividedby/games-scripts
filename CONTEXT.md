# Context — games-scripts

Domain glossary for the userscripts in this repo. Glossary only: no implementation
details, no specs. When a term here conflicts with how code or an issue uses a word,
the glossary wins (or the glossary is wrong and gets fixed here).

## Connections Color Marker

### Tile
One of the 16 word cards on the Connections board. Identified by its word (the
game's `data-flip-id`), never by position, because Shuffle moves tiles.

### Group
Four tiles that share a connection. The game gives each group a **difficulty
color**: yellow (easiest), green, blue, purple (hardest).

### Mark
The color the player *thinks* a tile belongs to. A guess, not a fact; at most 4
tiles per mark color. Saved per puzzle.

### Solved group
A group the game has confirmed, shown as a colored bar with its four words. Its
color is fact and overrides any marks (see Reconcile).

### Reconcile
Correcting marks after a group is solved: if 3 or 4 of its tiles shared a mark
color, that color and the real color swap everywhere; then any other tile still
wearing the solved color loses it.

### Palette
The floating bar of controls: the four mark colors and Go on top; erase, undo,
the sort button, the optional ? and 📜, settings and the hide toggle below. On
phones it is one row, and ⋯ swaps that row for the less-used tools (‹ swaps back).
Before Play, on the results screen, or when hidden, it shrinks to 🎨.

### Armed color
A color tapped on the palette while no tiles are selected. The next tap decides
what it does: a second color swaps the two; Go submits it.

### Out of order / Sure?
Submitting an armed color that isn't next in the sort order. Go turns red and asks
**Sure?**; a second tap within 4 seconds submits. Right after Sure? expires, Go
ignores taps briefly so a late tap can't submit the next color instead.

### Exchange
Tapping a full color with one of its tiles and one outside tile selected: the two
tiles trade colors, so the color stays at 4.

### Sort order / reverse rainbow
The order rows are drawn and Go submits in. **Reverse rainbow** (P→Y, the
default) is purple, blue, green, yellow: hardest first, a challenge many players
go for. **Rainbow** (Y→P) is the opposite. **Off** leaves tiles in the game's
order; Go still submits purple first and never asks Sure?. Marked tiles move into
their color's row as soon as they're marked; blank tiles pad short rows, and split
tiles come after the color rows.

### Go next
Go with nothing armed: submits the next unsolved color in the sort order.

### Auto-fill
Once three colors have 4 tiles (marked or solved) and exactly 4 tiles are left
(blank, split, or already the last color), those 4 get the last color.

### One away
The game's message for a wrong guess with 3 of 4 tiles from one group. The script
remembers such guesses and badges their tiles with a letter per guess. A guess is
**settled** once a solved group holds 3 of its words; settled guesses lose their
badges.

### Guess history
The wrong guesses on a puzzle, oldest first, each flagged if the game called it
One away. A guess counts as wrong when the game's mistake count drops; right
guesses and repeats ("Already guessed") are not recorded.

### Maybe / split tile
An undecided tile: two or more candidate colors ("could be yellow or green"), shown
as an outline split like a pie. A tile is either decided (one Mark) or split, never
both. Split tiles are notes only: Go, auto-fill and the 4-per-color limit use Marks
alone. When a color is solved it drops out of every split; a split left with one
color becomes that color's Mark (if the color has room).

A **lone candidate** is a split down to one color whose color is already full: it
can't become a Mark yet, so its outline is dashed.

### Maybe mode
The palette state while **?** is on: tapping a color adds it to (or removes it
from) the selected tiles' candidates instead of setting their Mark. Tiles hold
still in maybe mode and re-sort when it's turned off.
