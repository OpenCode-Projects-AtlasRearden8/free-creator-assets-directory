# Free Creator Assets Directory

A single-file, offline static page listing **genuinely free** image, font, music,
icon, and mockup sources for authors and small businesses. Every card states the
license type in plain English, what you may sell, where to download from the
official source, a link that proves it is truly free, and the date the license
was last re-checked. **No affiliate links, no tracking, no sign-ups.**

It complements the *plain-english-ip-guide* (which covers copyright,
trademarks, and licensing for creators in plain English). Together: the guide
teaches the concepts; this directory points at places to act on them.

Built and maintained by **Asdale Dynamics, LLC** — Dylan Asdale's company for
beginner-friendly AI education and practical creator tools.

## What's in the folder

| File | What it is |
| --- | --- |
| `index.html` | The whole directory as one self-contained page (works offline, even from `file://`). Open it in any browser; no build step or server needed to *use* it. |
| `assets.json` | The canonical data: meta, the need-vocabulary, and 29 source entries. Edit this, never the embedded JSON. |
| `build.js` | Copies `assets.json` into `index.html` (between the `ASSETS_JSON` markers). Run after every data change. |
| `test/validate.js` | Dependency-free test script: JSON schema validation + page-render validation. |
| `package.json` | Task runner only (`npm run build`, `npm run test`). No dependencies. |
| `LICENSE` | MIT, © 2026 Asdale Dynamics, LLC |

## Using the page

By default it shows all 29 cards. Use the need chips ("Book covers", "Print and
paper", "Videos", …), the kind-of-asset dropdown, the credit-requirement filter
("No credit needed" is the crowd-favorite), the freshness filter, and plain
search. Filters combine. The page is just one HTML file, so you can email it,
print it, or copy it to a USB stick and it still works.

## How to maintain it

1. **Add or change a source** — edit `assets.json`. Each entry needs:
   - `name`, `category` (`images` | `fonts` | `music` | `icons` | `mockups`),
   - `url`, `downloadUrl` (both must be the **official** source, https),
   - `licenseName`, `licensePlain` (everyday language),
   - `sellPlain` (what selling is allowed, and the hard limits),
   - `attribution` (`none` | `credit` | `check`),
   - `proofUrl` + `proofNote` (where the source itself states the license),
   - `needs` (tags from the `needs` vocabulary in the same file),
   - `recheck` (the date you last confirmed the license, `YYYY-MM-DD`),
   - `notes` (caveats a normal person would want to know).
2. **Run the build** — `npm run build` (or `node build.js`). It spot-checks the
   data and rewrites the JSON inside `index.html`.
3. **Run the tests** — `npm run test` (or `node test/validate.js`). It validates
   the schema (types, required fields, https-only URLs, no affiliate or tracking
   fragments, fresh `recheck` dates, every category covered), confirms the JSON
   embedded in `index.html` is identical to `assets.json`, checks the HTML is
   well-formed and free of external requests, and then actually renders the
   page's JavaScript against a small DOM stub to prove all cards, chips, counts,
   and filters work.

### The recheck workflow (important)

Licenses change — FreePD.com, for example, simply closed in 2025, and
incompetech that same year was actively reorganizing how its tracks are claimed
on YouTube. The `recheck` date is the heartbeat of this directory:

- Every entry must carry a `recheck` date within ~13 months; the test fails
  otherwise, so staleness cannot sneak in quietly.
- On a recheck: open `proofUrl`, confirm the license text still says what our
  card says, update the `recheck` date, run `npm run build && npm run test`.
- If a source is no longer trusted or has closed, remove or rewrite the card in
  the same commit — never leave a card whose proof link contradicts it.

### Content rules (enforced or by convention)

- Official pages only; every link https; no affiliate/tracking fragments —
  the test script rejects `ref=`, `utm_`, `tag=`, shorteners, and friends.
- Plain English over legalese on every card; legalese links belong on the
  source's own site.
- When "it depends per item" (e.g. mockup directories), the card must say so
  honestly in `licensePlain` and `sellPlain`, and use `attribution: "check"`.
- No secrets, API keys, or personal data anywhere in this folder.

## Verification methodology

- License claims were confirmed from each source's own published license or
  policy page (e.g. Pixabay's Content License Summary, unDraw's license page,
  the Rijksmuseum's Information & Data Policy, NARA's copyright/permissions
  pages, SIL OFL texts, and the MIT/ISC LICENSE files at each icon project's
  official repository) at the recheck dates shown on the cards.
- A `recheck` of 2026-10-30 means: reviewed during this directory's initial
  release review on that date.

## Known limitations

- "Proof" links are official pages but websites move them occasionally; the
  recheck workflow (above) is the fix.
- Entries marked `check` (mockup archives, multi-license libraries) require you
  to read the license shown per item — that is stated on their cards.
- The page is intentionally offline-only: no images, fonts, or analytics are
  loaded, so it renders the same everywhere but links require internet.

## License

MIT — see `LICENSE` (Copyright (c) 2026 Asdale Dynamics, LLC).
Third-party sources keep their own licenses; the cards summarize them but the
source's official license text always rules.
