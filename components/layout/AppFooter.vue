<template>
  <footer class="app-footer">
    <AdSlot format="leaderboard" class="app-footer__ad" />

    <div class="app-footer__inner">
      <div class="app-footer__brand">
        <NuxtLink :to="localePath('/')" class="app-footer__logo">{{ brand }}</NuxtLink>
        <p class="app-footer__tagline">{{ t('footer.tagline') }}</p>
        <p class="app-footer__privacy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M12 3l7 3v6c0 4.4-3 8.2-7 9-4-.8-7-4.6-7-9V6l7-3z" />
            <path d="M9.5 12l2 2 3.5-4" />
          </svg>
          {{ t('footer.privacyLine') }}
        </p>
      </div>

      <nav class="app-footer__cols" :aria-label="t('footer.categories')">
        <div class="app-footer__col">
          <h2 class="app-footer__col-title">{{ t('footer.categories') }}</h2>
          <ul>
            <li v-for="cat in categories" :key="cat.key">
              <NuxtLink :to="localePath(`/category/${cat.key}`)">{{ cat.name }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div class="app-footer__col">
          <h2 class="app-footer__col-title">{{ t('nav.popularTools') }}</h2>
          <ul>
            <li v-for="tool in popular" :key="tool.slug">
              <NuxtLink :to="localePath(`/tool/${tool.slug}`)">{{ tool.name }}</NuxtLink>
            </li>
          </ul>
        </div>

        <div class="app-footer__col">
          <h2 class="app-footer__col-title">{{ t('nav.allTools') }}</h2>
          <ul>
            <li><NuxtLink :to="localePath('/all-tools')">{{ t('nav.allTools') }}</NuxtLink></li>
            <li><NuxtLink :to="localePath('/')">{{ t('nav.home') }}</NuxtLink></li>
            <li><a href="/sitemap.xml">{{ t('footer.sitemap') }}</a></li>
          </ul>
          <p class="app-footer__langs">{{ t('footer.languageNote') }}</p>
        </div>
      </nav>
    </div>

    <div class="app-footer__bottom">
      <p>{{ t('footer.copyright', { year, brand }) }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { brand } = useRuntimeConfig().public
const { categories, featured } = useToolsData()

const year = new Date().getFullYear()
const popular = computed(() => featured.value.slice(0, 8))
</script>

<style scoped lang="scss">
.app-footer {
  background: $bg-white;
  border-top: 1px solid $border-color;
  margin-top: $spacing-xxl;
}

.app-footer__ad {
  max-width: $content-max;
  margin: $spacing-lg auto 0;
  padding: 0 $spacing-md;
}

.app-footer__inner {
  max-width: $content-max;
  margin: 0 auto;
  padding: $spacing-xl $spacing-md;
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: $spacing-xl;

  @include mobile-and-tablet {
    grid-template-columns: 1fr;
    gap: $spacing-lg;
  }
}

.app-footer__logo {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: -0.02em;
}

.app-footer__tagline {
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  max-width: 320px;
}

.app-footer__privacy {
  @include flex-start;
  gap: $spacing-xs;
  margin-top: $spacing-md;
  font-size: $font-size-xs;
  color: $success-color;

  svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }
}

.app-footer__cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-lg;

  @include mobile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.app-footer__col-title {
  font-size: $font-size-xs;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $text-placeholder;
  margin-bottom: $spacing-sm;
}

.app-footer__col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.app-footer__col a {
  font-size: $font-size-sm;
  color: $text-secondary;

  &:hover {
    color: $accent-color;
  }
}

.app-footer__langs {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  color: $text-placeholder;
}

.app-footer__bottom {
  border-top: 1px solid $border-color;
  padding: $spacing-md;
  text-align: center;

  p {
    font-size: $font-size-xs;
    color: $text-placeholder;
  }
}
</style>
