import { CATEGORIES, TOOLS, getRelatedTools, type CategoryKey, type ToolDef } from '~/data/tools'

export interface LocalizedTool extends ToolDef {
  name: string
  short: string
  seoTitle: string
  seoDescription: string
  keywords: string
}

export interface LocalizedCategory {
  key: CategoryKey
  icon: string
  name: string
  description: string
}

/**
 * 工具数据的本地化读取层。
 * 所有工具名称/描述/SEO 文案存放在 i18n/locales/<locale>.json 的 tools.<slug> 下，
 * 缺失时由 vue-i18n 自动回退到英文。
 */
export function useToolsData() {
  const { t } = useI18n()

  const localize = (tool: ToolDef): LocalizedTool => ({
    ...tool,
    name: t(`tools.${tool.slug}.name`),
    short: t(`tools.${tool.slug}.short`),
    seoTitle: t(`tools.${tool.slug}.seoTitle`),
    seoDescription: t(`tools.${tool.slug}.seoDescription`),
    keywords: t(`tools.${tool.slug}.keywords`)
  })

  const tools = computed<LocalizedTool[]>(() => TOOLS.map(localize))

  const categories = computed<LocalizedCategory[]>(() =>
    CATEGORIES.map((c) => ({
      key: c.key,
      icon: c.icon,
      name: t(`categories.${c.key}.name`),
      description: t(`categories.${c.key}.description`)
    }))
  )

  const featured = computed(() => tools.value.filter((t2) => t2.featured))

  const byCategory = (key: CategoryKey) => computed(() => tools.value.filter((x) => x.category === key))

  const getLocalizedBySlug = (slug: string) => computed(() => tools.value.find((x) => x.slug === slug))

  const search = (query: string) =>
    computed(() => {
      const q = query.trim().toLowerCase()
      if (!q) return tools.value
      return tools.value.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.short.toLowerCase().includes(q) ||
          x.keywords.toLowerCase().includes(q) ||
          x.slug.includes(q)
      )
    })

  const related = (slug: string, limit = 6) =>
    computed(() => getRelatedTools(slug, limit).map(localize))

  const categoryByKey = (key: CategoryKey) => computed(() => categories.value.find((c) => c.key === key))

  return {
    tools,
    categories,
    featured,
    byCategory,
    getLocalizedBySlug,
    search,
    related,
    categoryByKey
  }
}

/** 工具页通用 SEO 文案（HowTo / FAQ 模板，避免 24×12 的文案爆炸） */
export function useToolPageContent(slug: string) {
  const { t } = useI18n()
  const name = computed(() => t(`tools.${slug}.name`))

  const steps = computed(() => [
    t('toolPage.step1', { tool: name.value }),
    t('toolPage.step2', { tool: name.value }),
    t('toolPage.step3', { tool: name.value })
  ])

  const faqs = computed(() => [
    { q: t('toolPage.faq1.q', { tool: name.value }), a: t('toolPage.faq1.a', { tool: name.value }) },
    { q: t('toolPage.faq2.q', { tool: name.value }), a: t('toolPage.faq2.a', { tool: name.value }) },
    { q: t('toolPage.faq3.q', { tool: name.value }), a: t('toolPage.faq3.a', { tool: name.value }) }
  ])

  return { name, steps, faqs }
}
