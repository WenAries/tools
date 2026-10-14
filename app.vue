<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const { brand, siteUrl } = useRuntimeConfig().public

// 全站默认元信息；各页面可覆盖
const localePath = useLocalePath()
const head = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: true
})

useHead(() => ({
  titleTemplate: (title?: string) => (title ? `${title} | ${brand}` : `${brand} — ${t('site.tagline')}`),
  htmlAttrs: { lang: locale.value, ...head.value.htmlAttrs },
  link: [...(head.value.link || [])],
  meta: [...(head.value.meta || [])]
}))

// 全站 Organization / WebSite 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      id: 'ld-org',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${siteUrl}/#organization`,
            name: brand,
            url: `${siteUrl}${localePath('/')}`
          },
          {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#website`,
            name: brand,
            url: `${siteUrl}${localePath('/')}`,
            inLanguage: locale.value,
            publisher: { '@id': `${siteUrl}/#organization` },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${siteUrl}${localePath('/')}?q={search_term_string}`
              },
              'query-input': 'required name=search_term_string'
            }
          }
        ]
      })
    }
  ]
})
</script>
