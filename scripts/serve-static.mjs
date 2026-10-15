#!/usr/bin/env node
/**
 * 静态产物本地预览服务器（零依赖）
 *
 * 用途：`nuxt generate` 产出的是纯静态文件，必须经由 HTTP 服务访问。
 *       直接双击 dist/index.html（file:// 协议）会失效：
 *         - /_nuxt/*.js 等绝对路径资源会被解析到磁盘根目录 → 脚本全部加载失败
 *         - 站内链接 /tool/xxx 会指向不存在的本地文件 → 浏览器报 "无法访问文件"
 *
 * 用法：
 *   node scripts/serve-static.mjs                 # 默认端口 3000，自动选择 dist 或 .output/public
 *   node scripts/serve-static.mjs --port 8080
 *   node scripts/serve-static.mjs --host 0.0.0.0  # 局域网共享（默认只监听本机）
 *   node scripts/serve-static.mjs --dir dist
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const argv = process.argv.slice(2)
const arg = (name, def) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def
}

const PORT = Number(arg('port', process.env.PORT || 3000))
const HOST = arg('host', '127.0.0.1')

const pickDir = () => {
  const explicit = arg('dir', '')
  if (explicit) return explicit
  for (const d of ['dist', '.output/public']) {
    if (existsSync(join(process.cwd(), d, 'index.html'))) return d
  }
  return ''
}

const DIR = pickDir()
if (!DIR) {
  console.error('\n✗ 未找到静态产物目录（dist 或 .output/public）。\n  请先执行： pnpm generate\n')
  process.exit(1)
}

const ROOT = resolve(process.cwd(), DIR)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf'
}

/** 依次尝试：原路径 → 目录下的 index.html → 补 .html */
async function resolveFile(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/'
  const targets = [join(ROOT, clean)]
  if (!extname(clean)) {
    targets.push(join(ROOT, clean, 'index.html'))
    targets.push(join(ROOT, clean + '.html'))
  }
  for (const t of targets) {
    if (!t.startsWith(ROOT)) continue // 防目录穿越
    try {
      const s = await stat(t)
      if (s.isFile()) return t
      if (s.isDirectory()) {
        const idx = join(t, 'index.html')
        if ((await stat(idx)).isFile()) return idx
      }
    } catch {}
  }
  return null
}

createServer(async (req, res) => {
  let pathname
  try {
    pathname = decodeURIComponent((req.url || '/').split('?')[0])
  } catch {
    pathname = '/'
  }

  const hit = await resolveFile(pathname)
  if (hit) {
    try {
      const body = await readFile(hit)
      const isHtml = extname(hit) === '.html'
      res.writeHead(200, {
        'content-type': MIME[extname(hit)] || 'application/octet-stream',
        // HTML 不缓存，便于重新 generate 后立即看到最新结果；带 hash 的资源长缓存
        'cache-control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable'
      })
      res.end(body)
      return
    } catch {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('500 Internal Error')
      return
    }
  }

  // 未命中：返回站点自带的 404 页面（nuxt generate 会生成 404.html）
  const notFound = await resolveFile('/404.html')
  if (notFound) {
    const body = await readFile(notFound)
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
    res.end(body)
    return
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('404 Not Found')
}).listen(PORT, HOST, () => {
  const shown = HOST === '0.0.0.0' ? 'localhost' : HOST
  console.log(`\n  ▲ 静态预览已启动`)
  console.log(`  - 目录: ${DIR}`)
  console.log(`  - 地址: http://${shown}:${PORT}\n`)
  console.log(`  提示：请务必通过该 HTTP 地址访问，不要直接双击 index.html（file:// 协议会导致资源与路由全部失效）。\n`)
})
