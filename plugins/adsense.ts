/**
 * Google AdSense —— 仅在配置了 Client ID 且开关打开时生效。
 *
 * 采用通用（非 client-only）插件，让 AdSense 脚本与 Search Console 校验 meta
 * 直接出现在服务端渲染的 HTML 里：
 *  - Search Console 的 meta 校验需要 HTML 首屏即存在
 *  - AdSense 审核与爬虫无需执行 JS 即可发现广告脚本
 *
 * 未配置时全站不加载任何第三方脚本，页面依旧完全可用。
 */
export default defineNuxtPlugin(() => {
  const { adsenseClient, adsenseEnabled, adsEnabled, googleSiteVerification } = useRuntimeConfig().public

  const meta: Record<string, unknown>[] = []
  if (googleSiteVerification) {
    meta.push({ name: 'google-site-verification', content: googleSiteVerification as string })
  }
  // 广告总开关关闭时不声明 adsense-account，避免向 Google 暴露尚未启用的广告接入
  if (adsEnabled && adsenseEnabled && adsenseClient) {
    meta.push({ name: 'google-adsense-account', content: adsenseClient as string })
  }

  if (meta.length) useHead({ meta })

  if (!adsEnabled || !adsenseEnabled || !adsenseClient) return

  useHead({
    script: [
      {
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`,
        async: true,
        crossorigin: 'anonymous'
      }
    ]
  })

  // 客户端提前初始化队列，避免 AdSlot 挂载时 window.adsbygoogle 未定义
  if (import.meta.client) {
    window.adsbygoogle = window.adsbygoogle || []
  }
})

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}
