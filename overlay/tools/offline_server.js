#!/usr/bin/env node
// Dev server with the same URL contract as the Android app:
//   /            -> dist/ (SPA fallback)
//   /assetpack/  -> asset pack directory on disk
//   /assetpack/archive/imods/ -> repo src/imods first, pack as fallback
// Usage: node tools/offline_server.js <assetPackDir> [port]
const http = require("http");
const fs = require("fs");
const path = require("path");

const ASSET_PACK_DIR = process.argv[2];
const PORT = Number(process.argv[3] || 8413);
const DIST = path.join(__dirname, "..", "dist");
const IMODS = path.join(__dirname, "..", "src", "imods");

if (!ASSET_PACK_DIR || !fs.existsSync(ASSET_PACK_DIR)) {
  console.error("Usage: node tools/offline_server.js <assetPackDir> [port]");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".swf": "application/x-shockwave-flash",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".eot": "application/vnd.ms-fontobject",
  ".epub": "application/epub+zip",
  ".pdf": "application/pdf"
};

function contentType(p) {
  return MIME[path.extname(p).toLowerCase()] || "application/octet-stream";
}

function send404(res, url) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found: " + url);
}

function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send404(res, filePath);
    const headers = {
      "Content-Type": contentType(filePath),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache"
    };
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m[1] ? parseInt(m[1]) : 0;
      let end = m[2] ? parseInt(m[2]) : stat.size - 1;
      if (isNaN(start) || start >= stat.size) start = 0;
      if (isNaN(end) || end >= stat.size) end = stat.size - 1;
      headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
      headers["Content-Length"] = end - start + 1;
      res.writeHead(206, headers);
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      headers["Content-Length"] = stat.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

// Resolve a decoded URL path safely under a root dir
function safeJoin(root, urlPath) {
  const resolved = path.normalize(path.join(root, urlPath));
  if (!resolved.startsWith(path.normalize(root))) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch (e) {
    return send404(res, req.url);
  }

  if (urlPath.startsWith("/assetpack/")) {
    const rel = urlPath.slice("/assetpack/".length);
    // imods overlay: prefer the repo's own copy (matches bundled mod JS)
    if (rel.startsWith("archive/imods/")) {
      const imodPath = safeJoin(IMODS, rel.slice("archive/imods/".length));
      if (imodPath && fs.existsSync(imodPath) && fs.statSync(imodPath).isFile()) {
        return serveFile(req, res, imodPath);
      }
    }
    const packPath = safeJoin(ASSET_PACK_DIR, rel);
    if (!packPath) return send404(res, urlPath);
    return serveFile(req, res, packPath);
  }

  // App bundle with SPA fallback
  let distPath = safeJoin(DIST, urlPath === "/" ? "index.html" : urlPath);
  if (!distPath) return send404(res, urlPath);
  fs.stat(distPath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback: any non-file path serves index.html
      return serveFile(req, res, path.join(DIST, "index.html"));
    }
    serveFile(req, res, distPath);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Offline TUHC server: http://127.0.0.1:${PORT}/`);
  console.log(`  dist:       ${DIST}`);
  console.log(`  asset pack: ${ASSET_PACK_DIR}`);
});
