# STATUS.md

Updated: 2026-10-30
Owner: Asdale Dynamics, LLC (Dylan Asdale)

## What was built

`free-creator-assets-directory` — a static, single-file, offline directory of
**genuinely free** creative-asset sources for authors and small businesses.

- **`index.html`** — the entire directory in one 48 KB file: zero external
  requests (no CDN fonts, no images, no analytics), works directly over
  `file://`. Renders 29 JSON-driven cards in 5 categories (images, fonts,
  music, icons, mockups). Need-based filters: 7 need chips (book covers, book
  interiors, social, video, websites, print, merch/POD) plus kind-of-asset,
  credit-requirement, and freshness (recheck date) filters, and free-text
  search. Filters combine; result count is announced accessibility-friendly.
  Each card shows: license in plain English, what you may sell, credit
  requirement, official download link, a proof link with why it is evidence,
  caveats, and the license re-check date. Light/dark aware, no legal advice
  disclaimer, companion reference to *plain-english-ip-guide*. No affiliate
  links — enforced by test.
- **`assets.json`** — canonical data (meta + 7-need vocabulary + 29 entries),
  editable without touching HTML/JS.
- **`build.js`** — validates the data and injects the JSON between
  `ASSETS_JSON` markers in `index.html`; idempotent.
- **`test/validate.js`** — dependency-free test suite (~600 assertions):
  schema validation (required fields, enums, https-only URLs, affiliate/
  tracker rejection, unique names, category coverage), recheck-date freshness
  (not future, < 400 days), embedded-JSON identity check, HTML well-formedness
  and no-external-request check, and a DOM-stub execution of the page's real
  JavaScript that verifies all cards render, chips render, counts read
  correctly, and filters match manual counts.
- **`README.md`** — maintenance guide: how to add/update entries, the build +
  test loop, the recheck workflow, content rules, verification methodology.
- **`LICENSE`** — MIT, Copyright (c) 2026 Asdale Dynamics, LLC.
- **`package.json`** — `npm run build` / `npm run test` only; no dependencies.

## How to run it

- Use: open `index.html` in any browser. Done — it is fully offline.
- Develop: edit `assets.json`, then `npm run build` (or `node build.js`).
- Verify: `npm run test` (or `node test/validate.js`).

## Verification results

Last verified run (2026-10-30), `node test/validate.js`:

- Schema: all 29 entries pass every field/enum/URL/date check; all 5 categories
  covered; all need tags resolve to the `needs` vocabulary.
- `index.html` embedded JSON is identical to `assets.json`; markers present.
- Static checks: all required element ids present; no external scripts or
  remote `src`; tags balanced; inline script compiles.
- Render run (DOM stub): page script executes without throwing; all 29 cards
  render; 7/7 need chips render; count text "Showing 29 of 29 sources".
- Filter logic: "no credit needed" returns the 19 expected sources; single-need
  and combined filters match manually counted expectations.
- Page hrefs (86 links) contain no affiliate/tracking fragments.
- `build.js` is idempotent (run twice consecutively; tests still pass).
- License claims were confirmed against official license/policy pages during
  the initial review (notably: FreePD.com closed in 2025 and was therefore
  **excluded**; incompetech confirmed active and licensing CC BY 4.0 in 2026;
  unDraw's custom license confirmed; Pixabay/Pexels/Unsplash "no attribution
  but no standalone resale" terms confirmed verbatim; Rijksmuseum's data
  policy and NARA's catalog-copyright statements confirmed).

## Known gaps

- Server-side link checking is not automated: `proofUrl`/`downloadUrl` values
  were human-verified; the test suite checks shape/hygiene, not that every URL
  is still live. The recheck workflow in the README covers drift.
- No visual screenshot test — rendering is validated via the DOM-stub run, not
  a headless browser. (Layout is plain CSS grid; risk is low.)
- Just 29 sources out of a possible ocean; a reasonable curated start, biased
  toward sources whose license pages could be confirmed.
- `mockup` category leans on two directory sites whose licenses are
  per-creator (`attribution: "check"` cards) — an honest limitation, clearly
  flagged on the cards rather than overpromised.
- `index.html` uses a `<script>`-embedded JSON block, so avoid editing the
  embedded data by hand; always go through `assets.json` + `build.js`.
- Git history begins fresh in this folder; no remote, no push (per project
  rules — never published).
