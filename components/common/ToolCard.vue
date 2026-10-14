<template>
  <NuxtLink :to="localePath(`/tool/${tool.slug}`)" class="tool-card">
    <span class="tool-card__icon" aria-hidden="true">{{ tool.icon }}</span>
    <span class="tool-card__body">
      <span class="tool-card__name">{{ tool.name }}</span>
      <span class="tool-card__desc">{{ tool.short }}</span>
    </span>
    <svg class="tool-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { LocalizedTool } from '~/composables/useToolsData'

defineProps<{ tool: LocalizedTool }>()

const localePath = useLocalePath()
</script>

<style scoped lang="scss">
.tool-card {
  @include card-base;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-md $spacing-md $spacing-md $spacing-md;
  color: inherit;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(6, 182, 212, 0.05));
    opacity: 0;
    transition: opacity $transition-base;
    pointer-events: none;
  }

  &:hover {
    color: inherit;
    transform: translateY(-2px);

    &::after {
      opacity: 1;
    }

    .tool-card__arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.tool-card__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: $radius-sm;
  background: $bg-subtle;
  font-size: 19px;
  line-height: 1;
}

.tool-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tool-card__name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.35;
}

.tool-card__desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  @include text-clamp(2);
  line-height: 1.5;
}

.tool-card__arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  color: $accent-color;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity $transition-base, transform $transition-base;
}
</style>
