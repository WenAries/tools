export default defineEventHandler((event) => {
  const { adsenseClient, adsenseEnabled, adsEnabled } = useRuntimeConfig(event).public as {
    adsenseClient?: string
    adsenseEnabled?: boolean
    adsEnabled?: boolean
  }

  if (!adsEnabled || !adsenseEnabled || !adsenseClient) {
    // 广告总开关关闭或未接入 AdSense 时直接返回 404，避免出现无效的 ads.txt 记录
    throw createError({ statusCode: 404, statusMessage: 'ads.txt not configured' })
  }

  // 去掉 ca- 前缀，ads.txt 中需要 pub-XXXX 形式
  const pubId = adsenseClient.replace(/^ca-/, '')

  const txt = `# AdSense ads.txt —— 由 NUXT_PUBLIC_ADSENSE_CLIENT 自动生成
google.com, ${pubId}, DIRECT, f08c47fec0942fa0
`

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=86400')
  return txt
})
