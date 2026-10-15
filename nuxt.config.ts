// https://nuxt.com/docs/api/configuration/nuxt-config
import { CATEGORIES, TOOLS } from './data/tools'

const SITE_URL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://www.freetools.fun').replace(/\/+$/, '')
const BRAND = process.env.NUXT_PUBLIC_BRAND || 'FreeTools'

const DEFAULT_LOCALE = 'en'

const LOCALES = [
  { code: 'en', language: 'en', name: 'English', file: 'en.json', dir: 'ltr' },
  { code: 'de', language: 'de', name: 'Deutsch', file: 'de.json', dir: 'ltr' },
  { code: 'fr', language: 'fr', name: 'Français', file: 'fr.json', dir: 'ltr' },
  { code: 'es', language: 'es', name: 'Español', file: 'es.json', dir: 'ltr' },
  { code: 'it', language: 'it', name: 'Italiano', file: 'it.json', dir: 'ltr' },
  { code: 'pt', language: 'pt', name: 'Português', file: 'pt.json', dir: 'ltr' },
  { code: 'nl', language: 'nl', name: 'Nederlands', file: 'nl.json', dir: 'ltr' },
  { code: 'ru', language: 'ru', name: 'Русский', file: 'ru.json', dir: 'ltr' },
  { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json', dir: 'ltr' },
  { code: 'ko', language: 'ko', name: '한국어', file: 'ko.json', dir: 'ltr' },
  { code: 'zh-CN', language: 'zh-CN', name: '简体中文', file: 'zh-CN.json', dir: 'ltr' },
  { code: 'zh-TW', language: 'zh-TW', name: '繁體中文', file: 'zh-TW.json', dir: 'ltr' }
] as const

/**
 * 站点全部路由（不含语言前缀）
 * 首页 + 全部工具 + 7 个分类 + 24 个工具详情
 */
const BASE_ROUTES = [
  '/',
  '/all-tools',
  ...CATEGORIES.map((c) => `/category/${c.key}`),
  ...TOOLS.map((t) => `/tool/${t.slug}`)
]

/**
 * 预渲染路由清单 = 33 条基础路由 × 12 种语言（默认语言无前缀）
 * 全站静态化 → 最佳 SEO / 最快 TTFB / 可部署到任意静态托管
 */
const PRERENDER_ROUTES = [
  ...BASE_ROUTES,
  ...LOCALES.filter((l) => l.code !== DEFAULT_LOCALE).flatMap((l) =>
    BASE_ROUTES.map((r) => (r === '/' ? `/${l.code}` : `/${l.code}${r}`))
  ),
  '/sitemap.xml',
  '/robots.txt'
]

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: true,

  modules: ['@nuxtjs/i18n'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['@@/assets/scss/global.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@@/assets/scss/variables.scss" as *; @use "@@/assets/scss/mixins.scss" as *;',
          silenceDeprecations: ['import', 'legacy-js-api']
        }
      }
    }
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },

  site: {
    url: SITE_URL,
    name: BRAND
  },

  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
      brand: BRAND,
      // ---------- 广告总开关 ----------
      // 默认关闭：全站不输出任何广告 DOM（含开发占位框），版位代码保留待用。
      // 流量达标、AdSense 审核通过后，把 NUXT_PUBLIC_ADS_ENABLED 置为 true 重新构建即可上线。
      adsEnabled: process.env.NUXT_PUBLIC_ADS_ENABLED === 'true',
      // Google AdSense — 预留广告位，填入 client id 并置 enabled=true 即全站生效
      adsenseClient: process.env.NUXT_PUBLIC_ADSENSE_CLIENT || '',
      adsenseEnabled: process.env.NUXT_PUBLIC_ADSENSE_ENABLED === 'true',
      // 通用广告单元 ID：所有版位复用同一个单元
      adsenseSlot: process.env.NUXT_PUBLIC_ADSENSE_SLOT || '',
      // 各版位专属广告单元 ID（优先于通用值；留空则回落到通用值）
      adsenseSlots: {
        leaderboard: process.env.NUXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD || '',
        rectangle: process.env.NUXT_PUBLIC_ADSENSE_SLOT_RECTANGLE || '',
        skyscraper: process.env.NUXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER || '',
        inArticle: process.env.NUXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE || '',
        horizontal: process.env.NUXT_PUBLIC_ADSENSE_SLOT_HORIZONTAL || '',
        multiplex: process.env.NUXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX || ''
      },
      // Google Search Console 校验（可选）
      googleSiteVerification: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
      // 统计（可选，纯前端、不采集个人数据）
      analyticsProvider: process.env.NUXT_PUBLIC_ANALYTICS_PROVIDER || '',
      analyticsId: process.env.NUXT_PUBLIC_ANALYTICS_ID || ''
    }
  },

  i18n: {
    restructureDir: 'i18n',
    defaultLocale: DEFAULT_LOCALE,
    strategy: 'prefix_except_default',
    baseUrl: SITE_URL,
    langDir: 'locales',
    // 关闭浏览器语言自动检测：
    // 1) SSG 下没有服务端重定向，客户端检测会在水合时切换 locale，导致首页
    //    "Hydration completed but contains mismatches" + 首屏语言闪变；
    // 2) JS 语言重定向对 Googlebot 抓取不友好，多语言分发已由 hreflang + sitemap 承担；
    // 3) 用户语言偏好改由语言切换器写入 cookie 维护。
    detectBrowserLanguage: false,
    locales: LOCALES as unknown as any[],
    vueI18n: './i18n.config.ts',
    // 保持严格模式（strictMessage 默认 true）：语言包若混入真实 HTML 会在构建期直接报错，
    // 需原样展示标签的文案请用 vue-i18n 字面量语法，例如 "Wrap in {'<'}p{'>'} tags"
    bundle: { optimizeTranslationDirective: false }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: PRERENDER_ROUTES
    }
  },

  experimental: {
    payloadExtraction: true
  }
})
