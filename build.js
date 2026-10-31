#!/usr/bin/env node
/*
 * build.js - inject assets.json into index.html (single-file offline page).
 *
 * The canonical data lives in assets.json. This script spot-checks the data and
 * rewrites the JSON between the ASSETS_JSON markers in index.html. Run it after
 * any data change:
 *
 *     node build.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "assets.json");
const HTML_FILE = path.join(__dirname, "index.html");
const BEGIN = "<!-- ASSETS_JSON_BEGIN -->";
const END = "<!-- ASSETS_JSON_END -->";

function fail(msg) {
  console.error("build failed: " + msg);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
} catch (err) {
  fail("assets.json is not valid JSON: " + err.message);
}

if (!data.meta || !Array.isArray(data.entries) || data.entries.length === 0) {
  fail("assets.json must have meta and a non-empty entries array");
}

data.entries.forEach((entry, i) => {
  const required = ["name", "category", "url", "downloadUrl",
    "licenseName", "licensePlain", "sellPlain", "proofUrl", "proofNote",
    "attribution", "recheck"];
  for (const field of required) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) {
      fail(`entry ${i} ("${entry.name || "?"}") is missing the "${field}" field`);
    }
  }
});

let html = fs.readFileSync(HTML_FILE, "utf8").toString();
const beginIdx = html.indexOf(BEGIN);
const endIdx = html.indexOf(END);
if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
  fail("index.html is missing one of the " + "ASSETS_JSON markers");
}

const serialized = JSON.stringify(data, null, 2);
const merged = html.slice(0, beginIdx + BEGIN.length) +
  "\n" + serialized + "\n" + html.slice(endIdx);

fs.writeFileSync(HTML_FILE, merged, "utf8");
console.log("build ok: " + data.entries.length + " entries written into index.html (total " +
  Math.round(fs.statSync(HTML_FILE).size / 1024) + " KB)");
