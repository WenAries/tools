<template>
  <div class="all-tools">
    <Breadcrumbs :items="crumbs" />

    <header class="all-tools__head">
      <h1 class="all-tools__title">{{ t('nav.allTools') }}</h1>
      <p class="all-tools__subtitle">{{ t('home.toolCount', { count: tools.length }) }}</p>
    </header>

    <section v-for="cat in categories" :id="cat.key" :key="cat.key" class="all-tools__group">
      <NuxtLink :to="localePath(`/category/${cat.key}`)" class="all-tools__group-head">
        <span class="all-tools__group-icon" aria-hidden="true">{{ cat.icon }}</span>
        <h2>{{ cat.name }}</h2>
        <span class="all-tools__group-count">{{ countOf(cat.key) }}</span>
      </NuxtLink>
      <div class="all-tools__grid">
        <ToolCard v-for="tool in byCat(cat.key)" :key="tool.slug" :tool="tool" />
      </div>
    </section>

    <AdSlot format="leaderboard" class="all-tools__ad" />
  </div>
</template>

<script setup lang="ts">
import type { CategoryKey } from '~/data/tools'

const { t } = useI18n()
const localePath = useLocalePath()
const { tools, categories, byCategory } = useToolsData()

const byCat = (key: CategoryKey) => byCategory(key).value
const countOf = (key: CategoryKey) => tools.value.filter((x) => x.category === key).length

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.allTools') }
])

useSeoHead({
  title: () => `${t('nav.allTools')} — ${t('site.shortTagline')}`,
  description: () => t('seo.homeDescription'),
  keywords: () => t('seo.homeKeywords'),
  path: () => localePath('/all-tools')
})
</script>

<style scoped lang="scss">
.all-tools {
  animation: fade-up 0.4s $ease-out both;
}

.all-tools__head {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-md;
  border-bottom: 2px solid $border-color;
}

.all-tools__title {
  font-size: $font-size-xxl;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin-bottom: 4px;
}

.all-tools__subtitle {
  font-size: $font-size-base;
  color: $text-muted;
}

.all-tools__group {
  margin-bottom: $spacing-xl;
}

.all-tools__group-head {
  @include flex-start;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;

  h2 {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $text-primary;
  }

  &:hover h2 {
    color: $accent-color;
  }
}

.all-tools__group-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: $radius-sm;
  background: $bg-subtle;
  font-size: 16px;
}

.all-tools__group-count {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-placeholder;
  padding: 2px 7px;
  border-radius: $radius-full;
  background: $bg-subtle;
}

.all-tools__grid {
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
