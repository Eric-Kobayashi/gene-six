# Gene Six

A mobile-friendly human gene guessing game, inspired by Eric Kobayashi’s Wordle project: https://github.com/Eric-Kobayashi/eric-kobayashi.github.io. This is an independently written implementation.

Six character slots, six guesses. Approved HGNC symbols of 1–6 letters or digits are accepted. Short symbols are right-padded with actual spaces. Blanks participate in scoring just like letters or digits; Space or the Blank button enters one, and Enter fills remaining slots. Internal or leading blanks are invalid because gene symbols do not contain spaces.

## Run

Serve this directory with `python3 -m http.server 8000`, then open http://localhost:8000. No build step, dependencies, API keys, backend, analytics, or external runtime assets. Node.js 20+ can run `npm test`.

## Daily puzzle

The answer is computed entirely in the browser: SHA-256 of `gene-six:v1:fern-helix-47:YYYY-MM-DD` (UTC), first four bytes as an unsigned big-endian integer, modulo the curated answer-list length. This is deterministic, not cryptographic secrecy: source and bundled data are inspectable. Keep the seed and answer list stable to preserve the daily schedule. Daily progress is saved locally by UTC date. Practice uses browser cryptographic randomness.

The only automatic network request beyond the static HTML/CSS/JS is the bundled `genes.json` asset on the same host. There are no gene/answer API calls. HGNC links open only when clicked. Static assets must load once; this version does not promise offline availability after closing the browser.

## Data

Source: HGNC complete set, downloaded 2026-10-20 from https://storage.googleapis.com/public-download-files/hgnc/json/json/hgnc_complete_set.json (https://www.genenames.org/download/statistics-and-files/).

19,577 approved symbols consisting of 1–6 ASCII letters/digits are accepted. 243 curated, familiar symbols form the answer pool. Gene names and HGNC identifiers are bundled for reveal and the searchable library. Symbols longer than six characters or containing punctuation are excluded. HGNC data is available under CC0: https://www.genenames.org/about/license/.

## GitHub Pages

Publish directly from branch `main`, folder `/` in Settings → Pages. All asset paths are relative, so both project and user Pages URLs work. `.nojekyll` disables Jekyll processing.
