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
the sort button, the optional ? and 📜, settings and the hide toggle below (on
phones, one row with the less-used tools behind ⋯).

### Armed color
A color tapped on the palette while no tiles are selected. The next tap decides
what it does: a second color swaps the two; Go submits it.

### Exchange
Tapping a full color with one of its tiles and one outside tile selected: the two
tiles trade colors, so the color stays at 4.

### Sort order / reverse rainbow
The order rows are drawn and Go submits in. Reverse rainbow is purple, blue,
green, yellow (hardest first), the goal ordering the script is built around;
rainbow is the opposite; Off leaves the game's order.

### Go next
Go with nothing armed: submits the next unsolved color in the sort order.

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
