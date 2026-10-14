import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export interface SeoHeadInput {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  /** 已本地化的站点内路径，如 /de/tool/json-formatter */
  path: MaybeRefOrGetter<string>
  keywords?: MaybeRefOrGetter<string | undefined>
  type?: 'website' | 'article'
  robots?: string
  image?: string
  jsonLd?: MaybeRefOrGetter<Record<string, any> | Record<string, any>[] | undefined>
}

/**
 * 统一 SEO 输出：title / description / keywords / canonical / hreflang / OpenGraph / Twitter / JSON-LD
 * 全站每个页面都走这里，保证 SEO 元信息一致且完整。
 */
export function useSeoHead(input: SeoHeadInput) {
  const { public: pub } = useRuntimeConfig()
  const { locale, locales } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const abs = (p: string) => `${pub.siteUrl}${p === '/' ? '' : p}`
  const siteUrl = pub.siteUrl as string

  const alternates = computed(() => {
    const links: Array<Record<string, string>> = []
    const safeSwitch = (code: string) => {
      try {
        return switchLocalePath(code as never) || null
      } catch {
        return null
      }
    }
    for (const l of locales.value as Array<{ code: string; language?: string }>) {
      const p = safeSwitch(l.code)
      if (!p) continue
      links.push({ rel: 'alternate', hreflang: l.language || l.code, href: abs(p) })
    }
    const fallback = safeSwitch('en')
    if (fallback) links.push({ rel: 'alternate', hreflang: 'x-default', href: abs(fallback) })
    return links
  })

  const scripts = computed(() => {
    const data = toValue(input.jsonLd)
    if (!data) return []
    const list = Array.isArray(data) ? data : [data]
    return list.map((item, i) => ({
      type: 'application/ld+json',
      id: `ld-page-${i}`,
      innerHTML: JSON.stringify(item)
    }))
  })

  useHead(() => {
    const title = toValue(input.title)
    const description = toValue(input.description)
    const path = toValue(input.path)
    const keywords = toValue(input.keywords)
    const url = abs(path)

    return {
      title,
      meta: [
        { name: 'description', content: description },
        ...(keywords ? [{ name: 'keywords', content: keywords }] : []),
        {
          name: 'robots',
          content:
            input.robots ||
            'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        },
        { property: 'og:type', content: input.type || 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:site_name', content: pub.brand },
        { property: 'og:locale', content: locale.value },
        { property: 'og:image', content: input.image || `${siteUrl}/og-image.png` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: input.image || `${siteUrl}/og-image.png` }
      ],
      link: [{ rel: 'canonical', href: url }, ...alternates.value],
      script: scripts.value
    }
  })
}

/** 面包屑结构化数据 */
export function buildBreadcrumb(items: Array<{ name: string; url?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {})
    }))
  }
}

/** 工具类 WebApplication 结构化数据 */
export function buildWebApplication(opts: {
  name: string
  description: string
  url: string
  category?: string
  inLanguage?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: opts.category || 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    inLanguage: opts.inLanguage,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  }
}

/** FAQ 结构化数据 */
export function buildFaqPage(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }
}

/** HowTo 结构化数据 */
export function buildHowTo(opts: { name: string; description: string; steps: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: s
    }))
  }
}
