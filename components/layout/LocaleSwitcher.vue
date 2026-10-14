<template>
  <div class="locale-switcher" @keydown.esc="open = false">
    <button
      class="locale-switcher__trigger"
      type="button"
      :aria-label="t('a11y.switchLanguage')"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <svg class="locale-switcher__globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
      <span class="locale-switcher__code">{{ currentShort }}</span>
      <svg class="locale-switcher__caret" :class="{ 'is-open': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <Transition name="dropdown">
      <ul v-show="open" class="locale-switcher__list" role="listbox">
        <li v-for="l in locales" :key="l.code" role="option" :aria-selected="l.code === locale">
          <NuxtLink
            class="locale-switcher__item"
            :class="{ 'is-active': l.code === locale }"
            :to="switchLocalePath(l.code)"
            :hreflang="l.language"
            @click="open = false"
          >
            <span class="locale-switcher__name">{{ l.name }}</span>
            <span class="locale-switcher__badge">{{ l.code }}</span>
          </NuxtLink>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const open = ref(false)

const currentShort = computed(() => {
  const code = locale.value
  return code === 'zh-CN' ? '简' : code === 'zh-TW' ? '繁' : code.split('-')[0].toUpperCase()
})

onMounted(() => {
  const close = () => (open.value = false)
  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    if (!el.closest('.locale-switcher')) close()
  })
})
</script>

<style scoped lang="scss">
.locale-switcher {
  position: relative;
}

.locale-switcher__trigger {
  @include flex-center;
  gap: $spacing-xs;
  height: 34px;
  padding: 0 $spacing-sm;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: border-color $transition-fast, color $transition-fast;

  &:hover {
    border-color: $border-strong;
    color: $text-primary;
  }
}

.locale-switcher__globe {
  width: 16px;
  height: 16px;
}

.locale-switcher__caret {
  width: 14px;
  height: 14px;
  transition: transform $transition-fast;

  &.is-open {
    transform: rotate(180deg);
  }
}

.locale-switcher__list {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 120;
  min-width: 210px;
  max-height: 380px;
  overflow-y: auto;
  list-style: none;
  padding: $spacing-xs;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
}

.locale-switcher__item {
  @include flex-between;
  gap: $spacing-md;
  padding: 7px $spacing-sm;
  border-radius: $radius-sm;
  color: $text-secondary;
  font-size: $font-size-sm;

  &:hover {
    background: $bg-subtle;
    color: $text-primary;
  }

  &.is-active {
    background: $brand-50;
    color: $accent-color;
    font-weight: 600;
  }
}

.locale-switcher__badge {
  font-size: 10px;
  font-family: $font-family-mono;
  color: $text-placeholder;
  text-transform: uppercase;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity $transition-fast, transform $transition-fast;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
