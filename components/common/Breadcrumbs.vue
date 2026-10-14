<template>
  <nav class="breadcrumbs" :aria-label="t('a11y.breadcrumb')">
    <ol>
      <li v-for="(item, i) in items" :key="i">
        <NuxtLink v-if="item.to && i < items.length - 1" :to="item.to">{{ item.label }}</NuxtLink>
        <span v-else aria-current="page">{{ item.label }}</span>
        <svg v-if="i < items.length - 1" class="breadcrumbs__sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; to?: string }>
}>()

const { t } = useI18n()
</script>

<style scoped lang="scss">
.breadcrumbs {
  margin-bottom: $spacing-md;
}

.breadcrumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  list-style: none;
}

.breadcrumbs li {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.breadcrumbs a {
  color: $text-muted;

  &:hover {
    color: $accent-color;
  }
}

.breadcrumbs span[aria-current] {
  color: $text-primary;
  font-weight: 500;
}

.breadcrumbs__sep {
  width: 13px;
  height: 13px;
  color: $border-strong;
  flex-shrink: 0;
}
</style>
