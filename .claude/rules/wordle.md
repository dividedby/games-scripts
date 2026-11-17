---
paths:
  - "wordle/wordle-shortlist.user.js"
  - "wordle/tools/*.mjs"
  - ".github/workflows/update-wordle-words.yml"
---

# Wordle word lists

The word block in `wordle-shortlist.user.js` is generated: likely answers in CAPITALS,
other guessable words lowercase. Never edit it by hand; `pnpm update-words` rebuilds it
from WordGamesBot and bumps the patch version and changelog when it changed. The
monthly workflow `.github/workflows/update-wordle-words.yml` runs the same command and
opens a pull request (it needs "Allow GitHub Actions to create and approve pull
requests" on in the repo's Actions settings). GitHub turns scheduled workflows off after
60 days without repository activity; re-enable it from the Actions tab if that happens.
