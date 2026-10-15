<template>
  <div class="layout">
    <a class="layout__skip" href="#main">{{ t('a11y.skipToContent') }}</a>

    <AppHeader />

    <div class="layout__body">
      <AppSidebar class="layout__sidebar" />

      <main id="main" class="layout__main">
        <slot />
      </main>

      <!--
        右侧广告栏：广告位恢复时把 .layout__body 的 grid-template-columns 加回 $rail-width，
        并去掉 .layout__rail 的 display: none 即可。
        当前广告总开关关闭，此处不占位，避免正文被推向左侧。
      -->
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
  width: 100%;
  max-width: $shell-max;
  margin: 0 auto;
  display: grid;
  // 当前只有「侧边栏 + 内容」两列，内容自然居中（右侧广告栏已停用）
  grid-template-columns: $sidebar-width minmax(0, 1fr);
  align-items: start;

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
  width: 100%;
  padding: $spacing-lg $spacing-xl;
  max-width: $content-max;
  margin: 0 auto;

  @include mobile-and-tablet {
    padding: $spacing-md;
  }
}

.layout__rail {
  // 广告位暂停期间彻底退出布局，正文因此居中而不是被 300px 空列推向左侧。
  // 恢复广告位：删掉 display: none，并把 $rail-width 加回 .layout__body 的列模板。
  display: none;

  position: sticky;
  top: $header-height;
  padding: $spacing-lg $spacing-lg 0 0;
  height: calc(100vh - #{$header-height});
}
</style>
