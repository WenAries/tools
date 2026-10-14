<template>
  <div class="tool-page">
    <Breadcrumbs :items="crumbs" />

    <header class="tool-page__head">
      <span class="tool-page__icon" aria-hidden="true">{{ tool?.icon }}</span>
      <div class="tool-page__heading">
        <h1 class="tool-page__title">{{ tool?.name }}</h1>
        <p class="tool-page__desc">{{ tool?.short }}</p>
        <div class="tool-page__meta">
          <span class="tool-page__chip">🔒 {{ t('toolPage.privacyNote') }}</span>
          <NuxtLink :to="localePath(`/category/${tool?.category}`)" class="tool-page__chip tool-page__chip--link">
            {{ t('toolPage.inCategory') }}: {{ categoryName }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <AdSlot format="leaderboard" />

    <section class="tool-page__stage" :aria-label="tool?.name">
      <Suspense>
        <component :is="toolComponent" v-if="toolComponent" />
        <template #fallback>
          <div class="tool-page__loading">{{ t('common.loading') }}</div>
        </template>
      </Suspense>
    </section>

    <AdSlot format="in-article" />

    <!-- HowTo —— 既服务用户也服务搜索引擎 -->
    <section class="tool-page__block">
      <h2 class="tool-page__block-title">{{ t('toolPage.howToTitle', { tool: tool?.name }) }}</h2>
      <ol class="tool-page__steps">
        <li v-for="(step, i) in steps" :key="i">
          <span class="tool-page__step-num">{{ i + 1 }}</span>
          <span>{{ step }}</span>
        </li>
      </ol>
    </section>

    <!-- 内链：相关工具 -->
    <section class="tool-page__block">
      <h2 class="tool-page__block-title">{{ t('toolPage.relatedTitle') }}</h2>
      <div class="tool-page__grid">
        <ToolCard v-for="item in relatedTools" :key="item.slug" :tool="item" />
      </div>
    </section>

    <!-- FAQ -->
    <section class="tool-page__block">
      <h2 class="tool-page__block-title">{{ t('toolPage.faqTitle') }}</h2>
      <div class="tool-page__faq">
        <details v-for="(faq, i) in faqs" :key="i" class="tool-page__faq-item" :open="i === 0">
          <summary>
            <span>{{ faq.q }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <p>{{ faq.a }}</p>
        </details>
      </div>
    </section>

    <AdSlot format="horizontal" />

    <a href="#main" class="tool-page__top">↑ {{ t('toolPage.backToTop') }}</a>
  </div>
</template>

<script setup lang="ts">
import { getToolBySlug } from '~/data/tools'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { siteUrl } = useRuntimeConfig().public

const slug = computed(() => route.params.slug as string)
const raw = computed(() => getToolBySlug(slug.value))

if (!raw.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tool Not Found', fatal: true })
}

const { getLocalizedBySlug, related, categories } = useToolsData()
const tool = getLocalizedBySlug(slug.value)
const relatedTools = related(slug.value, 6)
const { steps, faqs } = useToolPageContent(slug.value)

const categoryName = computed(() => categories.value.find((c) => c.key === raw.value?.category)?.name || '')

/** 工具组件按需异步加载：首屏只加载当前工具，缩短 LCP */
const components: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'json-formatter': defineAsyncComponent(() => import('~/components/tools/JsonFormatter.vue')),
  'json-to-typescript': defineAsyncComponent(() => import('~/components/tools/JsonToTypescript.vue')),
  'regex-tester': defineAsyncComponent(() => import('~/components/tools/RegexTester.vue')),
  'jwt-decoder': defineAsyncComponent(() => import('~/components/tools/JwtDecoder.vue')),
  'hash-generator': defineAsyncComponent(() => import('~/components/tools/HashGenerator.vue')),
  'timestamp-converter': defineAsyncComponent(() => import('~/components/tools/TimestampConverter.vue')),
  'word-counter': defineAsyncComponent(() => import('~/components/tools/WordCounter.vue')),
  'case-converter': defineAsyncComponent(() => import('~/components/tools/CaseConverter.vue')),
  'markdown-preview': defineAsyncComponent(() => import('~/components/tools/MarkdownPreview.vue')),
  'lorem-ipsum-generator': defineAsyncComponent(() => import('~/components/tools/LoremIpsumGenerator.vue')),
  'text-diff': defineAsyncComponent(() => import('~/components/tools/TextDiff.vue')),
  'base64-encoder': defineAsyncComponent(() => import('~/components/tools/Base64Encoder.vue')),
  'url-encoder': defineAsyncComponent(() => import('~/components/tools/UrlEncoder.vue')),
  'html-entity-encoder': defineAsyncComponent(() => import('~/components/tools/HtmlEntityEncoder.vue')),
  'uuid-generator': defineAsyncComponent(() => import('~/components/tools/UuidGenerator.vue')),
  'password-generator': defineAsyncComponent(() => import('~/components/tools/PasswordGenerator.vue')),
  'qr-code-generator': defineAsyncComponent(() => import('~/components/tools/QrCodeGenerator.vue')),
  'image-compressor': defineAsyncComponent(() => import('~/components/tools/ImageCompressor.vue')),
  'image-converter': defineAsyncComponent(() => import('~/components/tools/ImageConverter.vue')),
  'image-resizer': defineAsyncComponent(() => import('~/components/tools/ImageResizer.vue')),
  'pdf-merge': defineAsyncComponent(() => import('~/components/tools/PdfMerge.vue')),
  'pdf-split': defineAsyncComponent(() => import('~/components/tools/PdfSplit.vue')),
  'pdf-compress': defineAsyncComponent(() => import('~/components/tools/PdfCompress.vue')),
  'color-converter': defineAsyncComponent(() => import('~/components/tools/ColorConverter.vue'))
}

const toolComponent = computed(() => components[slug.value] || null)

const crumbs = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: categoryName.value, to: localePath(`/category/${raw.value?.category}`) },
  { label: tool.value?.name || '' }
])

// 预渲染所有工具页（构建时生成静态 HTML）

useSeoHead({
  title: () => tool.value?.seoTitle || tool.value?.name || '',
  description: () => tool.value?.seoDescription || tool.value?.short || '',
  keywords: () => tool.value?.keywords,
  path: () => localePath(`/tool/${slug.value}`),
  jsonLd: () => [
    buildBreadcrumb([
      { name: t('nav.home'), url: `${siteUrl}${localePath('/')}` },
      { name: categoryName.value, url: `${siteUrl}${localePath(`/category/${raw.value?.category}`)}` },
      { name: tool.value?.name || '', url: `${siteUrl}${localePath(`/tool/${slug.value}`)}` }
    ]),
    buildWebApplication({
      name: tool.value?.name || '',
      description: tool.value?.seoDescription || tool.value?.short || '',
      url: `${siteUrl}${localePath(`/tool/${slug.value}`)}`,
      category: 'UtilitiesApplication',
      inLanguage: (locale.value as string) || 'en'
    }),
    buildHowTo({
      name: t('toolPage.howToTitle', { tool: tool.value?.name }),
      description: tool.value?.short || '',
      steps: steps.value
    }),
    buildFaqPage(faqs.value)
  ]
})
</script>

<style scoped lang="scss">
.tool-page {
  animation: fade-up 0.4s $ease-out both;
}

.tool-page__head {
  @include flex-start;
  align-items: flex-start;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.tool-page__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $brand-50, rgba(6, 182, 212, 0.12));
  font-size: 26px;
}

.tool-page__title {
  font-size: $font-size-xxl;
  font-weight: 800;
  letter-spacing: -0.028em;
  margin-bottom: 4px;
}

.tool-page__desc {
  font-size: $font-size-md;
  color: $text-secondary;
  max-width: 780px;
}

.tool-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.tool-page__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: $radius-full;
  background: $success-bg;
  color: $success-color;
  font-size: $font-size-xs;
  font-weight: 500;
}

.tool-page__chip--link {
  background: $bg-subtle;
  color: $text-secondary;

  &:hover {
    color: $accent-color;
  }
}

.tool-page__stage {
  @include surface;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;

  @include mobile {
    padding: $spacing-md;
  }
}

.tool-page__loading {
  padding: $spacing-xxl;
  text-align: center;
  color: $text-placeholder;
}

.tool-page__block {
  margin-top: $spacing-xl;
}

.tool-page__block-title {
  font-size: $font-size-lg;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color;
}

.tool-page__steps {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  li {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    font-size: $font-size-base;
    color: $text-secondary;
  }
}

.tool-page__step-num {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: $radius-full;
  background: $brand-50;
  color: $accent-color;
  font-size: $font-size-xs;
  font-weight: 700;
}

.tool-page__grid {
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

.tool-page__faq {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tool-page__faq-item {
  @include surface;
  overflow: hidden;

  summary {
    @include flex-between;
    gap: $spacing-md;
    padding: $spacing-md;
    cursor: pointer;
    font-size: $font-size-base;
    font-weight: 600;
    color: $text-primary;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      color: $text-muted;
      transition: transform $transition-fast;
    }
  }

  &[open] summary svg {
    transform: rotate(180deg);
  }

  p {
    padding: 0 $spacing-md $spacing-md;
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-relaxed;
  }
}

.tool-page__top {
  display: block;
  margin-top: $spacing-lg;
  text-align: center;
  font-size: $font-size-sm;
  color: $text-muted;
}
</style>
