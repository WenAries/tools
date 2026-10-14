<template>
  <header class="app-header">
    <div class="app-header__inner">
      <button
        class="app-header__menu"
        type="button"
        :aria-label="t('nav.openMenu')"
        @click="ui.toggleSidebar()"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <NuxtLink :to="localePath('/')" class="app-header__logo" :aria-label="brand">
        <span class="app-header__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#ftGrad)" />
            <path d="M10 21.5 16 10l6 11.5H10Z" fill="#fff" fill-opacity=".95" />
            <circle cx="16" cy="19" r="2" fill="#4f46e5" />
            <defs>
              <linearGradient id="ftGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1" />
                <stop offset="1" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="app-header__brand">{{ brand }}</span>
      </NuxtLink>

      <div class="app-header__search">
        <SearchBar
          :model-value="ui.searchQuery.value"
          :placeholder="t('nav.searchPlaceholder')"
          compact
          @update:model-value="onSearchInput"
          @submit="goSearch"
        />
      </div>

      <nav class="app-header__nav" :aria-label="t('a11y.mainNavigation')">
        <NuxtLink :to="localePath('/all-tools')" class="app-header__link hide-mobile">
          {{ t('nav.allTools') }}
        </NuxtLink>
        <LocaleSwitcher />
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const ui = useUiState()
const { brand } = useRuntimeConfig().public

let timer: ReturnType<typeof setTimeout> | null = null

function onSearchInput(value: string) {
  ui.searchQuery.value = value
  // 输入防抖后仅在首页做即时过滤，其他页面跳回首页并带上查询参数
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    if (value && route.path !== localePath('/')) {
      router.push({ path: localePath('/'), query: { q: value } })
    }
  }, 350)
}

function goSearch(value: string) {
  ui.searchQuery.value = value
  router.push({ path: localePath('/'), query: value ? { q: value } : {} })
}
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid $border-color;
}

.app-header__inner {
  @include flex-between;
  gap: $spacing-md;
  height: $header-height;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 $spacing-lg;

  @include mobile {
    padding: 0 $spacing-md;
    gap: $spacing-sm;
  }
}

.app-header__menu {
  display: none;
  @include flex-center;
  width: 36px;
  height: 36px;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  background: $bg-white;
  color: $text-primary;
  cursor: pointer;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }

  @include mobile {
    display: flex;
  }
}

.app-header__logo {
  @include flex-start;
  gap: $spacing-sm;
  flex-shrink: 0;
  color: $text-primary;

  &:hover {
    color: $text-primary;
  }
}

.app-header__mark {
  display: block;
  width: 30px;
  height: 30px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.app-header__brand {
  font-size: $font-size-md;
  font-weight: 700;
  letter-spacing: -0.02em;

  @include mobile {
    display: none;
  }
}

.app-header__search {
  flex: 1;
  max-width: 460px;
  margin: 0 $spacing-md;

  @include mobile {
    margin: 0;
    max-width: none;
  }
}

.app-header__nav {
  @include flex-start;
  gap: $spacing-md;
  flex-shrink: 0;
}

.app-header__link {
  font-size: $font-size-sm;
  font-weight: 500;
  color: $text-secondary;

  &:hover,
  &.router-link-active {
    color: $accent-color;
  }
}
</style>
