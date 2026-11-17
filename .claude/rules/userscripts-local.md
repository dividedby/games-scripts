---
paths:
  - "**/*.user.js"
---

# Deliberate exceptions to the userscript checklist (this repo)

- No `@noframes`: phone-width testing runs the installed script in a same-origin 390px
  iframe of the game.
- NYT Games Dark runs at `document-start` so its colors are on before first paint (no
  white flash).
