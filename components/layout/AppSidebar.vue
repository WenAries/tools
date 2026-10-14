<template>
  <div class="sidebar-shell">
    <aside class="app-sidebar" :class="{ 'is-open': ui.sidebarOpen.value }">
      <div class="app-sidebar__head">
        <span class="app-sidebar__title">{{ t('nav.categories') }}</span>
        <span class="app-sidebar__count">{{ tools.length }}</span>
      </div>

      <nav :aria-label="t('a11y.toolNavigation')">
        <div v-for="cat in categories" :key="cat.key" class="app-sidebar__group">
          <NuxtLink :to="localePath(`/category/${cat.key}`)" class="app-sidebar__group-head">
            <span class="app-sidebar__group-icon" aria-hidden="true">{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </NuxtLink>

          <ul class="app-sidebar__list">
            <li v-for="tool in byCat(cat.key)" :key="tool.slug">
              <NuxtLink
                :to="localePath(`/tool/${tool.slug}`)"
                class="app-sidebar__item"
                :class="{ 'is-active': route.params.slug === tool.slug }"
                @click="ui.closeSidebar()"
              >
                <span class="app-sidebar__item-icon" aria-hidden="true">{{ tool.icon }}</span>
                <span class="app-sidebar__item-name">{{ tool.name }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="app-sidebar__ad">
        <AdSlot format="skyscraper" />
      </div>
    </aside>

    <div v-if="ui.sidebarOpen.value" class="app-sidebar__overlay" @click="ui.closeSidebar()" />
  </div>
</template>

<script setup lang="ts">
import type { CategoryKey } from '~/data/tools'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const ui = useUiState()
const { tools, categories, byCategory } = useToolsData()

function byCat(key: CategoryKey) {
  return byCategory(key).value
}
</script>

<style scoped lang="scss">
.sidebar-shell {
  height: 100%;
}

.app-sidebar {
  height: 100%;
  overflow-y: auto;
  padding: $spacing-lg $spacing-sm $spacing-xl;
  background: $bg-white;
  border-right: 1px solid $border-color;

  @include mobile-and-tablet {
    position: fixed;
    top: $header-height;
    bottom: 0;
    left: 0;
    width: 282px;
    z-index: 95;
    transform: translateX(-100%);
    transition: transform $transition-base;
    box-shadow: $shadow-lg;

    &.is-open {
      transform: translateX(0);
    }
  }
}

.app-sidebar__head {
  @include flex-between;
  padding: 0 $spacing-sm $spacing-sm;
  margin-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color;
}

.app-sidebar__title {
  font-size: $font-size-xs;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $text-placeholder;
}

.app-sidebar__count {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
  color: $text-placeholder;
}

.app-sidebar__group {
  margin-bottom: $spacing-md;
}

.app-sidebar__group-head {
  @include flex-start;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: $text-muted;

  &:hover {
    color: $accent-color;
  }
}

.app-sidebar__group-icon {
  font-size: $font-size-sm;
}

.app-sidebar__list {
  list-style: none;
}

.app-sidebar__item {
  @include flex-start;
  gap: $spacing-sm;
  padding: 6px $spacing-sm 6px $spacing-md;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  border-left: 2px solid transparent;

  &:hover {
    background: $bg-subtle;
    color: $text-primary;
  }

  &.is-active {
    background: $brand-50;
    color: $accent-color;
    border-left-color: $accent-color;
    font-weight: 600;
  }
}

.app-sidebar__item-icon {
  font-size: $font-size-sm;
  flex-shrink: 0;
}

.app-sidebar__item-name {
  @include text-truncate;
}

.app-sidebar__ad {
  margin-top: $spacing-lg;
}

.app-sidebar__overlay {
  position: fixed;
  inset: 0;
  top: $header-height;
  background: rgba(15, 23, 42, 0.45);
  z-index: 90;
}
</style>
