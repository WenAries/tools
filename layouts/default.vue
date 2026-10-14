<template>
  <div class="layout">
    <a class="layout__skip" href="#main">{{ t('a11y.skipToContent') }}</a>

    <AppHeader />

    <div class="layout__body">
      <AppSidebar class="layout__sidebar" />

      <main id="main" class="layout__main">
        <slot />
      </main>

      <aside class="layout__rail" :aria-label="t('a11y.advertisement')">
        <AdSlot format="skyscraper" :show-on-mobile="false" />
      </aside>
    </div>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout__skip {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 200;
  padding: $spacing-sm $spacing-md;
  background: $accent-color;
  color: #fff;
  border-radius: 0 0 $radius-sm 0;

  &:focus {
    left: 0;
    color: #fff;
  }
}

.layout__body {
  flex: 1;
  display: grid;
  grid-template-columns: $sidebar-width minmax(0, 1fr) 300px;
  align-items: start;

  @media (max-width: 1279px) {
    grid-template-columns: $sidebar-width minmax(0, 1fr);
  }

  @include mobile-and-tablet {
    grid-template-columns: minmax(0, 1fr);
  }
}

.layout__sidebar {
  position: sticky;
  top: $header-height;
  height: calc(100vh - #{$header-height});

  @include mobile-and-tablet {
    // 移动/平板端抽屉本体已是 position: fixed（脱离文档流），但这个壳仍是 grid item
    // 且带 height: calc(100vh - header)，在单列布局里会占一整行空盒子，
    // 把正文推下去形成大段空白。display: contents 让壳不生成盒子，
    // 其内部 fixed 元素（抽屉/遮罩）也不会产生 grid 行。
    display: contents;
  }
}

.layout__main {
  min-width: 0;
  padding: $spacing-lg $spacing-xl;
  max-width: $content-max;

  @include mobile-and-tablet {
    padding: $spacing-md;
  }
}

.layout__rail {
  position: sticky;
  top: $header-height;
  padding: $spacing-lg $spacing-lg 0 0;
  height: calc(100vh - #{$header-height});

  @media (max-width: 1279px) {
    display: none;
  }
}
</style>
