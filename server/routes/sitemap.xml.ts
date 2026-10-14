import { TOOLS, CATEGORIES } from '../../data/tools'

/**
 * 动态 sitemap：包含全部语言 × 全部页面，并输出 hreflang 互链。
 * 纯静态部署时会在构建阶段被预渲染成 /sitemap.xml。
 */
const LOCALES = [
  { code: 'en', lang: 'en' },
  { code: 'de', lang: 'de' },
  { code: 'fr', lang: 'fr' },
  { code: 'es', lang: 'es' },
  { code: 'it', lang: 'it' },
  { code: 'pt', lang: 'pt' },
  { code: 'nl', lang: 'nl' },
  { code: 'ru', lang: 'ru' },
  { code: 'ja', lang: 'ja' },
  { code: 'ko', lang: 'ko' },
  { code: 'zh-CN', lang: 'zh-CN' },
  { code: 'zh-TW', lang: 'zh-TW' }
]

const DEFAULT_LOCALE = 'en'

function localizedPath(locale: string, path: string) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  return `${prefix}${path === '/' ? '' : path}` || '/'
}

export default defineEventHandler((event) => {
  const siteUrl = (useRuntimeConfig(event).public.siteUrl as string).replace(/\/+$/, '')

  const paths: string[] = ['/', '/all-tools']
  for (const c of CATEGORIES) paths.push(`/category/${c.key}`)
  for (const t of TOOLS) paths.push(`/tool/${t.slug}`)

  const now = new Date().toISOString().slice(0, 10)

  const urls: string[] = []
  for (const path of paths) {
    const priority = path === '/' ? '1.0' : path.startsWith('/tool/') ? '0.8' : '0.6'
    for (const locale of LOCALES) {
      const loc = `${siteUrl}${localizedPath(locale.code, path)}` || siteUrl
      const alternates = LOCALES.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l.lang}" href="${siteUrl}${localizedPath(l.code, path)}"/>`
      ).join('\n')
      urls.push(
        [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <lastmod>${now}</lastmod>`,
          '    <changefreq>weekly</changefreq>',
          `    <priority>${priority}</priority>`,
          alternates,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${localizedPath(DEFAULT_LOCALE, path)}"/>`,
          '  </url>'
        ].join('\n')
      )
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return xml
})
