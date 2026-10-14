<template>
  <div class="error-page">
    <div class="error-page__inner">
      <p class="error-page__code">{{ error?.statusCode || 404 }}</p>
      <h1 class="error-page__title">
        {{ error?.statusCode === 404 ? $t('common.pageNotFound') : $t('common.error') }}
      </h1>
      <p class="error-page__desc">{{ $t('common.toolNotFoundDesc') }}</p>
      <div class="error-page__actions">
        <NuxtLink :to="$localePath('/')" class="error-page__btn error-page__btn--primary">
          {{ $t('common.backHome') }}
        </NuxtLink>
        <NuxtLink :to="$localePath('/all-tools')" class="error-page__btn">
          {{ $t('common.backToTools') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()

useSeoHead({
  title: () => '404',
  description: () => 'Page not found',
  path: () => '/404',
  robots: 'noindex, follow'
})
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: $spacing-xl;
  background: $bg-primary;
}

.error-page__inner {
  text-align: center;
  max-width: 520px;
}

.error-page__code {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, $brand-500, $accent-500);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: $spacing-md;
}

.error-page__title {
  font-size: $font-size-xl;
  font-weight: 700;
  margin-bottom: $spacing-sm;
}

.error-page__desc {
  font-size: $font-size-base;
  color: $text-secondary;
  margin-bottom: $spacing-lg;
}

.error-page__actions {
  display: flex;
  justify-content: center;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.error-page__btn {
  @include button-ghost;
  padding: $spacing-sm $spacing-md;
}

.error-page__btn--primary {
  background: $accent-color;
  border-color: $accent-color;
  color: #fff;

  &:hover {
    background: $accent-hover;
    color: #fff;
  }
}
</style>
