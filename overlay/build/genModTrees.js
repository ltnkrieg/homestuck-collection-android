// Generates build/webAppModTrees.json from src/imods (replaces the
// Makefile tree+jq step; dirs -> objects, files -> true).
const fs = require("fs");
const path = require("path");

function crawl(dir) {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    out[entry.name] = entry.isDirectory()
      ? crawl(path.join(dir, entry.name))
      : true;
  }
  return out;
}

const imodsDir = path.join(__dirname, "..", "src", "imods");
const result = { "archive/imods": crawl(imodsDir) };

const outPath = path.join(__dirname, "webAppModTrees.json");
fs.writeFileSync(outPath, JSON.stringify(result, null, 1));
console.log(
  `Wrote ${outPath} (${Object.keys(result["archive/imods"]).length} imod entries)`
);
