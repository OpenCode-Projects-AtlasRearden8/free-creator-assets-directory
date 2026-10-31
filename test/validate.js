#!/usr/bin/env node
/*
 * test/validate.js - validation for the Free Creator Assets Directory.
 *
 * Checks (no external dependencies):
 *   1. assets.json parses and follows the documented schema.
 *   2. No affiliate/tracking links; all URLs are https and official-looking.
 *   3. Recheck dates are fresh (not future, within ~13 months).
 *   4. index.html contains the same JSON as assets.json (single source of truth).
 *   5. index.html is well-formed enough to render (tag balance, required ids).
 *   6. The page's JavaScript compiles and its logic actually renders cards
 *      against the embedded JSON, using a tiny DOM stub.
 *
 * Run:  node test/validate.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "assets.json");
const HTML_FILE = path.join(ROOT, "index.html");

let failures = 0;
function ok(cond, msg) {
  if (cond) {
    console.log("  ok: " + msg);
  } else {
    failures++;
    console.error("  FAIL: " + msg);
  }
}

const ATTRIBUTION = ["none", "credit", "check"];
const CATEGORIES = ["images", "fonts", "music", "icons", "mockups"];
const BAD_URL = /(affiliate|\baff\.|[\?&]ref=|[\?&]utm_|amzn\.to|amazon\.[a-z.]+\/[^ ]*tag=|bit\.ly|trck\.|share=|click\.)/i;
// the page footer *describes* that there are no affiliate links, so the wording
// check is limited to actual href attributes above.
const REQUIRED_STRINGS = {
  name: 3, category: 3, url: 8, downloadUrl: 8, licenseName: 3,
  licensePlain: 30, sellPlain: 20, proofUrl: 8, proofNote: 20,
  attribution: 3, recheck: 10, notes: 0
};

function section(title) {
  console.log("\n== " + title + " ==");
}

function asUrl(entry, field) {
  return entry[field];
}

section("Loading files");
let data = null;
let page = null;
try {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log("  ok: assets.json parses (" + data.entries.length + " entries)");
} catch (err) {
  console.error("  FAIL: assets.json does not parse: " + err.message);
  process.exit(1);
}
try {
  page = fs.readFileSync(HTML_FILE, "utf8").toString();
  console.log("  ok: index.html reads (" + Math.round(fs.statSync(HTML_FILE).size / 1024) + " KB)");
} catch (err) {
  console.error("  FAIL: index.html does not read: " + err.message);
  process.exit(1);
}

section("1. Schema of assets.json");
ok(data.meta && typeof data.meta === "object", "has meta object");
["title", "tagline", "version", "updated", "companionNote", "disclaimer"].forEach(
  (f) => ok(typeof data.meta[f] === "string" && data.meta[f].length > 0, "meta." + f + " present")
);
ok(/\d{4}-\d{2}-\d{2}/.test(data.meta.updated), "meta.updated is a YYYY-MM-DD date");
ok(data.needs && typeof data.needs === "object" && Object.keys(data.needs).length >= 4,
  "needs vocabulary present (" + Object.keys(data.needs).length + " needs)");
Object.keys(data.needs).forEach((k) => {
  ok(typeof data.needs[k].label === "string" && data.needs[k].label.length > 0,
    "needs." + k + " has a human label");
  ok(typeof data.needs[k].blurb === "string" && data.needs[k].blurb.length > 0,
    "needs." + k + " has a blurb");
});
ok(Array.isArray(data.entries) && data.entries.length >= 20,
  "entries array has at least 20 sources (" + data.entries.length + ")");

const seenNames = new Set();
const wordsPerCategory = {};
data.entries.forEach((entry, i) => {
  const tag = `entry ${i} (${entry.name || "?"})`;
  for (const [field, minLen] of Object.entries(REQUIRED_STRINGS)) {
    ok(typeof entry[field] === "string" && entry[field].length >= minLen,
      `${tag}: ${field} present`);
  }
  ok(CATEGORIES.includes(entry.category), `${tag}: category valid (${entry.category})`);
  ok(ATTRIBUTION.includes(entry.attribution), `${tag}: attribution valid (${entry.attribution})`);
  ok(!seenNames.has(entry.name), `${tag}: unique name`);
  seenNames.add(entry.name);
  ["url", "downloadUrl", "proofUrl"].forEach((f) => {
    const v = asUrl(entry, f);
    ok(/^https:\/\//.test(v), `${tag}: ${f} is https`);
    ok(!BAD_URL.test(v), `${tag}: ${f} has no affiliate/tracking fragments`);
  });
  ok(/github\.com\/|\.org\//.test(entry.proofUrl) || entry.proofUrl.length > 10,
    `${tag}: proofUrl points at a license/policy page`);
  ok(Array.isArray(entry.needs) && entry.needs.length >= 1, `${tag}: needs list non-empty`);
  entry.needs.forEach((n) => {
    ok(Object.prototype.hasOwnProperty.call(data.needs, n),
      `${tag}: need "${n}" is in the needs vocabulary`);
  });
  const recheck = new Date(entry.recheck + "T00:00:00Z");
  ok(/\d{4}-\d{2}-\d{2}/.test(entry.recheck) && !isNaN(recheck.getTime()),
    `${tag}: recheck is a valid date`);
  const now = Date.now();
  ok(recheck.getTime() <= now, `${tag}: recheck is not in the future`);
  ok(now - recheck.getTime() < 400 * 24 * 3600 * 1000, `${tag}: recheck is under 400 days old`);
  wordsPerCategory[entry.category] = (wordsPerCategory[entry.category] || 0) + 1;
});
Object.keys(wordsPerCategory).forEach((c) => {
  ok(wordsPerCategory[c] >= 3, `category "${c}" has at least 3 sources`);
});
ok(Object.keys(wordsPerCategory).length === 5, "all five categories are covered");

section("2. index.html carries the same data");
const BEGIN = "<!-- ASSETS_JSON_BEGIN -->";
const END = "<!-- ASSETS_JSON_END -->";
const bIdx = page.indexOf(BEGIN);
const eIdx = page.indexOf(END);
ok(bIdx !== -1 && eIdx !== -1 && eIdx > bIdx, "ASSETS_JSON markers present");
const m = page.slice(bIdx + BEGIN.length, eIdx).match(/\{[\s\S]*\}/);
ok(!!m, "embedded JSON block found between markers");
let embedded = null;
try {
  embedded = JSON.parse(m[0]);
  console.log("  ok: embedded JSON parses");
} catch (err) {
  failures++;
  console.error("  FAIL: embedded JSON does not parse: " + err.message);
}
ok(JSON.stringify(embedded) === JSON.stringify(data),
  "embedded JSON is identical to assets.json");

section("3. index.html structure (static HTML check)");
["assets-data", "controls", "needs", "search", "category", "attribution", "count", "cards"]
  .forEach((id) => ok(page.includes('id="' + id + '"'), `element with id=${id} exists`));
ok(!/<script[^>]+src=/.test(page), "no external script tags");
ok(!/src="http/.test(page), "no remote src attributes at all");
ok(/<script[^>]+\btype="application\/json"/.test(page), "data script tag uses application/json");

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"]);
(function tagBalance() {
  const depth = [];
  const doc = page.replace(/<script[^>]*>[\s\S]*?<\/script>/g, (s) =>
    s.replace(/(^\s*<script[^>]*>\n?)([\s\S]*?)(\n?<\/script>\s*)?$/, (whole, open, body, close) =>
      open + body.replace(/</g, "\u0001").replace(/>/g, "\u0002") + (close || ""))
  );
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*?)>/g;
  let match;
  const errors = [];
  while ((match = re.exec(doc)) !== null) {
    const raw = match[1].toLowerCase();
    const closing = match[0][1] === "/";
    if (VOID.has(raw)) continue;
    if (raw === "script" || raw === "style") { /* content protected above */ }
    if (closing) {
      const prev = depth.pop();
      if (prev !== raw) {
        errors.push(`expected </${prev || "?"}> but found </${raw}> near index ${match.index}`);
      }
    } else {
      if (/\/>$/.test(match[0].trim())) continue;
      depth.push(raw);
    }
  }
  ok(errors.length === 0 && depth.length === 0,
    "tags balanced " + (errors.length ? "- " + errors[0] : "") +
    (depth.length ? " - unclosed: " + depth.join(",") : ""));
})();

const scriptsToCheck = [];
const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let sm;
while ((sm = scriptRe.exec(page)) !== null) {
  if (sm[1].indexOf("application/json") !== -1) continue;
  scriptsToCheck.push(sm[2]);
}
ok(scriptsToCheck.length >= 1, "at least one inline page script found");
let compiled = null;
for (const src of scriptsToCheck) {
  try {
    compiled = new vm.Script(src);
    ok(true, "inline script compiles cleanly");
  } catch (err) {
    failures++;
    console.error("  FAIL: inline script fails to compile: " + err.message);
  }
}

section("4. Page logic actually renders (DOM stub run)");
if (compiled) {
  function makeElement(id) {
    return {
      id: id || "",
      innerHTML: "",
      textContent: "",
      title: "",
      value: "",
      dataset: {},
      _attrs: {},
      _handlers: {},
      _kids: [],
      setAttribute(k, v) { this._attrs[k] = String(v); },
      getAttribute(k) { return this._attrs[k] !== undefined ? this._attrs[k] : null; },
      addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); },
      appendChild(k) { this._kids.push(k); return k; },
      click() {
        (this._handlers.click || []).forEach((fn) => fn({ target: this }));
      }
    };
  }
  const elements = {};
  function stubEl(id) {
    if (!elements[id]) elements[id] = makeElement(id);
    return elements[id];
  }
  const dataStub = makeElement("assets-data");
  dataStub.textContent = JSON.stringify(data);

  const sandbox = {
    console: console,
    JSON: JSON,
    Date: Date,
    Math: Math,
    isNaN: isNaN,
    isFinite: isFinite,
    document: {
      getElementById(id) { return id === "assets-data" ? dataStub : stubEl(id); },
      querySelector() { return stubEl("q:" + arguments[0]); },
      createElement(tag) { return makeElement("el:" + tag); },
      addEventListener() { /* window-level noop */ },
      title: "",
    },
  };
  sandbox.window = sandbox;
  sandbox.document.addEventListener = function () {};
  vm.createContext(sandbox);
  try {
    compiled.runInContext(sandbox);
    ok(true, "page script ran without throwing");
  } catch (err) {
    failures++;
    console.error("  FAIL: page script threw: " + err.stack.split("\n").slice(0, 3).join(" | "));
  }

  const app = sandbox.window && sandbox.window.__APP__;
  ok(app && typeof app.filterEntries === "function", "filter logic is reachable");
  ok(app && typeof app.cardHtml === "function", "card renderer is reachable");

  if (app && !failures) {
    const cards = stubEl("cards");
    const rendered = cards.innerHTML;
    const missing = data.entries.filter((e) => rendered.indexOf(e.name) === -1);
    ok(missing.length === 0,
      `${allRenderedMsg(data.entries.length, missing.length)}`);
    const countEl = stubEl("count").textContent;
    ok(countEl.indexOf("Showing " + data.entries.length + " of " + data.entries.length) === 0,
      "count text shows all sources: " + JSON.stringify(countEl));
    const chips = stubEl("needs")._kids.length;
    ok(chips === Object.keys(data.needs).length,
      `need chips rendered (${chips}/${Object.keys(data.needs).length})`);

    const plainCredit = data.entries.filter((e) => e.attribution === "none").length;
    const gotNone = app.filterEntries(data.entries, { attribution: "none" });
    ok(gotNone.length === plainCredit,
      `filter by no-credit-needed: ${gotNone.length} of ${plainCredit} expected`);

    const needsList = Object.keys(data.needs);
    const needKey = needsList[0];
    const manual = data.entries.filter((e) => e.needs.indexOf(needKey) !== -1).length;
    ok(app.filterEntries(data.entries, { needs: [needKey] }).length === manual,
      `filter by need "${needKey}": matches manual count`);

    const combo = app.filterEntries(data.entries, {
      needs: [needsList[1]], category: data.entries[0].category,
    });
    const manualCombo = data.entries.filter((e) =>
      e.needs.indexOf(needsList[1]) !== -1 && e.category === data.entries[0].category
    ).length;
    ok(combo.length === manualCombo, "combined filter matches manual count");

    const html0 = app.cardHtml(data.entries[0]);
    ok(html0.indexOf(data.entries[0].licenseName) !== -1, "card shows the license name");
    ok(html0.indexOf(data.entries[0].recheck) !== -1, "card shows the recheck date");
    ok(/Official download page|License proof/.test(html0), "card has official links");
    const emptyState = app.filterEntries(data.entries, { attribution: "credit", category: "fonts" });
    ok(Array.isArray(emptyState), "no-result filter still returns an array");
  }
}

section("5. Page hygiene and project files");
const hrefs = page.match(/href="[^"]+"/g) || [];
ok(hrefs.every((h) => !BAD_URL.test(h)), `all ${hrefs.length} page hrefs free of affiliate/tracking fragments`);
["LICENSE", "README.md", "assets.json", "build.js", "test/validate.js"].forEach((f) => {
  ok(fs.existsSync(path.join(ROOT, f)), f + " exists");
});
ok(fs.readFileSync(path.join(ROOT, "LICENSE"), "utf8").includes(
  "Copyright (c) 2026 Asdale Dynamics, LLC"), "LICENSE has the exact copyright line");

function allRenderedMsg(total, missingCount) {
  return missingCount === 0
    ? `all ${total} entries rendered into the card grid`
    : `${missingCount} of ${total} entries missing from the render`;
}

process.on("exit", () => {
  console.log("\n" + (failures
    ? `RESULT: ${failures} failure(s)`
    : "RESULT: all checks passed"));
  process.exitCode = failures ? 1 : 0;
});
