<template>
  <div class="home">
    <!-- Hero -->
    <section class="home__hero">
      <p class="home__eyebrow">{{ t('site.shortTagline') }}</p>
      <h1 class="home__title">{{ t('home.title') }}</h1>
      <p class="home__subtitle">{{ t('home.subtitle') }}</p>

      <div class="home__search">
        <SearchBar
          :model-value="query"
          :placeholder="t('nav.searchPlaceholder')"
          @update:model-value="onInput"
        />
      </div>

      <ul class="home__badges">
        <li v-for="b in badges" :key="b.title">
          <span class="home__badge-icon" aria-hidden="true">{{ b.icon }}</span>
          <strong>{{ b.title }}</strong>
        </li>
      </ul>
    </section>

    <!-- 搜索结果 -->
    <template v-if="query">
      <section class="home__section">
        <h2 class="home__section-title">
          {{ t('home.searchTitle', { query }) }}
          <span class="home__section-count">{{ t('home.resultCount', { count: results.length }) }}</span>
        </h2>

        <div v-if="results.length" class="home__grid">
          <ToolCard v-for="tool in results" :key="tool.slug" :tool="tool" />
        </div>

        <div v-else class="home__empty">
          <p class="home__empty-title">{{ t('home.noResults', { query }) }}</p>
          <p class="home__empty-hint">{{ t('home.noResultsHint') }}</p>
          <NuxtLink :to="localePath('/all-tools')" class="home__empty-cta">{{ t('nav.browseAll') }}</NuxtLink>
        </div>
      </section>
    </template>

    <!-- 默认首页内容 -->
    <template v-else>
      <AdSlot format="leaderboard" class="home__ad" />

      <section class="home__section">
        <h2 class="home__section-title">
          {{ t('home.popularTitle') }}
          <span class="home__section-count">{{ t('home.popularSubtitle') }}</span>
        </h2>
        <div class="home__grid">
          <ToolCard v-for="tool in featured" :key="tool.slug" :tool="tool" />
        </div>
      </section>

      <section class="home__section">
        <h2 class="home__section-title">
          {{ t('home.categoryTitle') }}
          <span class="home__section-count">{{ t('home.categorySubtitle') }}</span>
        </h2>
        <div class="home__cats">
          <NuxtLink
            v-for="cat in categories"
            :key="cat.key"
            :to="localePath(`/category/${cat.key}`)"
            class="home__cat"
          >
            <span class="home__cat-icon" aria-hidden="true">{{ cat.icon }}</span>
            <span class="home__cat-body">
              <span class="home__cat-name">{{ cat.name }}</span>
              <span class="home__cat-desc">{{ cat.description }}</span>
            </span>
            <span class="home__cat-count">{{ countOf(cat.key) }}</span>
          </NuxtLink>
        </div>
      </section>

      <AdSlot format="horizontal" class="home__ad" />

      <section class="home__section">
        <h2 class="home__section-title">{{ t('home.whyTitle', { brand }) }}</h2>
        <div class="home__why">
          <article v-for="item in why" :key="item.title" class="home__why-item">
            <span class="home__why-icon" aria-hidden="true">{{ item.icon }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </section>

      <section class="home__all">
        <NuxtLink :to="localePath('/all-tools')" class="home__all-cta">
          {{ t('home.ctaAllTools') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </NuxtLink>
        <p class="home__all-count">{{ t('home.toolCount', { count: tools.length }) }}</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CategoryKey } from '~/data/tools'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const ui = useUiState()
const { brand, siteUrl } = useRuntimeConfig().public

const { tools, categories, featured } = useToolsData()

const query = computed(() => (route.query.q as string) || ui.searchQuery.value || '')
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return tools.value
  return tools.value.filter(
    (x) =>
      x.name.toLowerCase().includes(q) ||
      x.short.toLowerCase().includes(q) ||
      x.keywords.toLowerCase().includes(q) ||
      x.slug.includes(q)
  )
})

const badges = computed(() => [
  { icon: '🔒', title: t('home.whyPrivateTitle') },
  { icon: '⚡', title: t('home.whyFastTitle') },
  { icon: '🌍', title: t('home.whyAnyDeviceTitle') }
])

const why = computed(() => [
  { icon: '🔒', title: t('home.whyPrivateTitle'), desc: t('home.whyPrivateDesc') },
  { icon: '⚡', title: t('home.whyFastTitle'), desc: t('home.whyFastDesc') },
  { icon: '🎁', title: t('home.whyFreeTitle'), desc: t('home.whyFreeDesc') },
  { icon: '📱', title: t('home.whyAnyDeviceTitle'), desc: t('home.whyAnyDeviceDesc') }
])

const countOf = (key: CategoryKey) => tools.value.filter((x) => x.category === key).length

let timer: ReturnType<typeof setTimeout> | null = null
function onInput(value: string) {
  ui.searchQuery.value = value
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    router.replace({ query: value ? { q: value } : {} })
  }, 300)
}

watch(
  () => route.query.q,
  (v) => {
    ui.searchQuery.value = (v as string) || ''
  }
)

// SEO
const canonicalPath = computed(() => localePath('/'))

useSeoHead({
  title: () => t('seo.homeTitle'),
  description: () => t('seo.homeDescription'),
  keywords: () => t('seo.homeKeywords'),
  path: canonicalPath,
  jsonLd: () => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('home.title'),
    numberOfItems: tools.value.length,
    itemListElement: featured.value.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      description: tool.short,
      url: `${siteUrl}${localePath(`/tool/${tool.slug}`)}`
    }))
  })
})
</script>

<style scoped lang="scss">
.home {
  animation: fade-up 0.4s $ease-out both;
}

.home__hero {
  padding: $spacing-lg 0 $spacing-xl;
  border-bottom: 1px solid $border-color;
  margin-bottom: $spacing-xl;
}

.home__eyebrow {
  display: inline-block;
  padding: 3px 10px;
  margin-bottom: $spacing-md;
  border-radius: $radius-full;
  background: $brand-50;
  color: $accent-color;
  font-size: $font-size-xs;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.home__title {
  font-size: $font-size-display;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: $spacing-sm;

  @include mobile {
    font-size: 30px;
  }
}

.home__subtitle {
  max-width: 680px;
  font-size: $font-size-md;
  color: $text-secondary;
  margin-bottom: $spacing-lg;
}

.home__search {
  max-width: 560px;
  margin-bottom: $spacing-lg;
}

.home__badges {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  list-style: none;

  li {
    @include flex-start;
    gap: 6px;
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.home__badge-icon {
  font-size: $font-size-base;
}

.home__section {
  margin-bottom: $spacing-xl;
}

.home__section-title {
  @include flex-between;
  align-items: baseline;
  gap: $spacing-md;
  font-size: $font-size-xl;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color;
}

.home__section-count {
  font-size: $font-size-sm;
  font-weight: 400;
  color: $text-muted;
}

.home__grid {
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

.home__cats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-md;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.home__cat {
  @include card-base;
  @include flex-start;
  gap: $spacing-md;
  padding: $spacing-md;

  &:hover {
    color: inherit;
    transform: translateY(-2px);
  }
}

.home__cat-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  background: linear-gradient(135deg, $brand-50, rgba(6, 182, 212, 0.1));
  font-size: 20px;
}

.home__cat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.home__cat-name {
  font-size: $font-size-md;
  font-weight: 600;
  color: $text-primary;
}

.home__cat-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  @include text-clamp(2);
}

.home__cat-count {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-placeholder;
  padding: 2px 7px;
  border-radius: $radius-full;
  background: $bg-subtle;
  flex-shrink: 0;
}

.home__why {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $spacing-md;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.home__why-item {
  @include surface;
  padding: $spacing-md;

  h3 {
    font-size: $font-size-base;
    font-weight: 600;
    margin: $spacing-sm 0 6px;
  }

  p {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.home__why-icon {
  font-size: 22px;
}

.home__all {
  text-align: center;
  padding: $spacing-lg 0;
}

.home__all-cta {
  @include button-primary;
  padding: $spacing-sm $spacing-lg;
  font-size: $font-size-md;

  svg {
    width: 16px;
    height: 16px;
  }
}

.home__all-count {
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-muted;
}

.home__empty {
  padding: $spacing-xl;
  text-align: center;
  border: 1px dashed $border-strong;
  border-radius: $radius-lg;
  background: $bg-white;
}

.home__empty-title {
  font-size: $font-size-md;
  font-weight: 600;
  margin-bottom: $spacing-xs;
}

.home__empty-hint {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-md;
}

.home__empty-cta {
  @include button-ghost;
}
</style>
