<template>
  <div v-if="category" class="category-page">
    <Breadcrumbs :items="crumbs" />

    <header class="category-page__head">
      <span class="category-page__icon" aria-hidden="true">{{ category.icon }}</span>
      <div>
        <h1 class="category-page__title">{{ category.name }}</h1>
        <p class="category-page__desc">{{ category.description }}</p>
      </div>
    </header>

    <AdSlot format="leaderboard" />

    <div class="category-page__grid">
      <ToolCard v-for="tool in categoryTools" :key="tool.slug" :tool="tool" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, type CategoryKey } from '~/data/tools'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { siteUrl } = useRuntimeConfig().public
const { categories, byCategory } = useToolsData()

const key = computed(() => route.params.category as CategoryKey)
const category = computed(() => categories.value.find((c) => c.key === key.value))
const categoryTools = computed(() => byCategory(key.value as CategoryKey).value)

if (!CATEGORIES.some((c) => c.key === key.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Category Not Found', fatal: true })
}

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.categories'), to: localePath('/all-tools') },
  { label: category.value?.name || '' }
])

useSeoHead({
  title: () =>
    t('seo.categoryTitle', { category: category.value?.name || '' }),
  description: () =>
    t('seo.categoryDescription', {
      category: category.value?.name?.toLowerCase() || '',
      description: category.value?.description || ''
    }),
  path: () => localePath(`/category/${key.value}`),
  jsonLd: () => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.value?.name,
    description: category.value?.description,
    hasPart: categoryTools.value.map((tool) => ({
      '@type': 'WebApplication',
      name: tool.name,
      description: tool.short,
      url: `${siteUrl}${localePath(`/tool/${tool.slug}`)}`
    }))
  })
})
</script>

<style scoped lang="scss">
.category-page {
  animation: fade-up 0.4s $ease-out both;
}

.category-page__head {
  @include flex-start;
  align-items: flex-start;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;
}

.category-page__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $brand-50, rgba(6, 182, 212, 0.1));
  font-size: 23px;
}

.category-page__title {
  font-size: $font-size-xxl;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin-bottom: 4px;
}

.category-page__desc {
  font-size: $font-size-base;
  color: $text-secondary;
  max-width: 720px;
}

.category-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-md;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}
</style>
