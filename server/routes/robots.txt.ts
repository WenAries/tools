export default defineEventHandler((event) => {
  const siteUrl = (useRuntimeConfig(event).public.siteUrl as string).replace(/\/+$/, '')

  const txt = `# FreeTools robots.txt
User-agent: *
Allow: /

# 屏蔽统计类路径（本项目无埋点接口，仅保留规则以防误抓）
Disallow: /api/

# 主要外链型 AI 抓取器可自由读取内容
User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return txt
})
