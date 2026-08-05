package dev.tuhc.android

import android.content.res.AssetManager
import fi.iki.elonen.NanoHTTPD
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.io.InputStream

/**
 * Local server on 127.0.0.1:8413 (same URL contract as tools/offline_server.js):
 *   /            -> APK assets www/ (SPA fallback)
 *   /assetpack/  -> asset pack directory on device storage
 *   /assetpack/archive/imods/ -> APK assets imods/ first, pack as fallback
 * Range requests supported for media seeking.
 */
class LocalServer(
    private val assets: AssetManager,
    @Volatile var assetPackDir: File?
) : NanoHTTPD("127.0.0.1", PORT) {

    companion object {
        const val PORT = 8413

        private val MIME = mapOf(
            "html" to "text/html; charset=utf-8",
            "js" to "text/javascript",
            "mjs" to "text/javascript",
            "css" to "text/css",
            "json" to "application/json",
            "wasm" to "application/wasm",
            "swf" to "application/x-shockwave-flash",
            "png" to "image/png",
            "gif" to "image/gif",
            "jpg" to "image/jpeg",
            "jpeg" to "image/jpeg",
            "svg" to "image/svg+xml",
            "ico" to "image/x-icon",
            "webp" to "image/webp",
            "mp3" to "audio/mpeg",
            "ogg" to "audio/ogg",
            "wav" to "audio/wav",
            "mp4" to "video/mp4",
            "webm" to "video/webm",
            "mov" to "video/quicktime",
            "txt" to "text/plain; charset=utf-8",
            "ttf" to "font/ttf",
            "otf" to "font/otf",
            "woff" to "font/woff",
            "woff2" to "font/woff2",
            "eot" to "application/vnd.ms-fontobject",
            "epub" to "application/epub+zip",
            "pdf" to "application/pdf"
        )

        fun contentType(path: String): String {
            val ext = path.substringAfterLast('.', "").lowercase()
            return MIME[ext] ?: "application/octet-stream"
        }
    }

    override fun serve(session: IHTTPSession): Response {
        val path = session.uri // already decoded by NanoHTTPD

        return try {
            if (path.startsWith("/assetpack/")) {
                serveAssetPack(session, path.removePrefix("/assetpack/"))
            } else {
                serveApp(path)
            }
        } catch (e: Exception) {
            newFixedLengthResponse(
                Response.Status.INTERNAL_ERROR, "text/plain", "Error: ${e.message}"
            )
        }
    }

    // ---------- /assetpack/ ----------

    private fun serveAssetPack(session: IHTTPSession, rel: String): Response {
        // imods overlay: the APK copy matches the bundled mod JS
        if (rel.startsWith("archive/imods/")) {
            val imodRel = "imods/" + rel.removePrefix("archive/imods/")
            openAsset(imodRel)?.let { (stream, size) ->
                return assetResponse(stream, size, rel)
            }
        }

        val root = assetPackDir
            ?: return notFound("asset pack not configured")
        val file = File(root, rel).canonicalFile
        if (!file.path.startsWith(root.canonicalPath) || !file.isFile) {
            return notFound(rel)
        }
        return fileResponse(session, file)
    }

    private fun fileResponse(session: IHTTPSession, file: File): Response {
        val mime = contentType(file.name)
        val total = file.length()
        val rangeHeader = session.headers["range"]

        if (rangeHeader != null) {
            val m = Regex("bytes=(\\d*)-(\\d*)").find(rangeHeader)
            if (m != null) {
                var start = m.groupValues[1].toLongOrNull() ?: 0L
                var end = m.groupValues[2].toLongOrNull() ?: (total - 1)
                if (start >= total) start = 0
                if (end >= total) end = total - 1
                val len = end - start + 1
                val fis = FileInputStream(file)
                fis.skip(start)
                val res = newFixedLengthResponse(
                    Response.Status.PARTIAL_CONTENT, mime, fis, len
                )
                res.addHeader("Content-Range", "bytes $start-$end/$total")
                res.addHeader("Accept-Ranges", "bytes")
                return res
            }
        }
        val res = newFixedLengthResponse(
            Response.Status.OK, mime, FileInputStream(file), total
        )
        res.addHeader("Accept-Ranges", "bytes")
        return res
    }

    // ---------- app bundle (APK assets) ----------

    private fun serveApp(path: String): Response {
        val rel = when {
            path == "/" -> "www/index.html"
            else -> "www" + path
        }
        openAsset(rel)?.let { (stream, size) ->
            return assetResponse(stream, size, rel)
        }
        // SPA fallback: unknown paths render the app shell
        openAsset("www/index.html")?.let { (stream, size) ->
            return assetResponse(stream, size, "index.html")
        }
        return notFound(path)
    }

    /** Open an APK asset, returning stream + size, or null if missing. */
    private fun openAsset(rel: String): Pair<InputStream, Long>? {
        return try {
            val size = try {
                assets.openFd(rel).use { it.length }
            } catch (e: IOException) {
                // compressed asset: no fd, drain a stream for the length
                assets.open(rel).use { s ->
                    var n = 0L
                    val buf = ByteArray(64 * 1024)
                    while (true) {
                        val r = s.read(buf)
                        if (r < 0) break
                        n += r
                    }
                    n
                }
            }
            Pair(assets.open(rel), size)
        } catch (e: IOException) {
            null
        }
    }

    private fun assetResponse(stream: InputStream, size: Long, name: String): Response {
        val res = newFixedLengthResponse(
            Response.Status.OK, contentType(name), stream, size
        )
        res.addHeader("Cache-Control", "no-cache")
        return res
    }

    private fun notFound(what: String) = newFixedLengthResponse(
        Response.Status.NOT_FOUND, "text/plain", "Not found: $what"
    )
}
