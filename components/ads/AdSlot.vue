<template>
  <div
    v-if="isLive || showPlaceholder"
    class="ad-slot"
    :class="[`ad-slot--${format}`, { 'ad-slot--filled': isLive, 'ad-slot--mobile-hidden': !showOnMobile }]"
  >
    <span class="ad-slot__label">{{ t('a11y.advertisement') }}</span>

    <!-- 正式广告位：配置 AdSense 后由服务端直接渲染 <ins>，避免加载后再插入造成 CLS -->
    <ins
      v-if="isLive"
      ref="insRef"
      class="adsbygoogle ad-slot__unit"
      :style="{ display: 'block', minHeight: `${minHeight}px` }"
      :data-ad-client="adsenseClient"
      :data-ad-slot="resolvedSlot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />

    <!-- 仅开发环境展示的预留占位，方便核对版位尺寸 -->
    <div v-else class="ad-slot__placeholder" :style="{ minHeight: `${minHeight}px` }">
      <svg class="ad-slot__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M8 15h8" />
      </svg>
      <span class="ad-slot__text">{{ format }} · {{ minHeight }}px</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** 版位形态：决定预留尺寸，避免 CLS */
  format?: 'leaderboard' | 'rectangle' | 'skyscraper' | 'in-article' | 'horizontal' | 'multiplex'
  /** AdSense 广告单元 ID；不传则回落到按版位配置的环境变量 */
  slot?: string
  /** 移动端也展示 */
  showOnMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  format: 'horizontal',
  slot: '',
  showOnMobile: true
})

const { t } = useI18n()
const { adsenseClient, adsenseEnabled, adsEnabled, adsenseSlot, adsenseSlots } = useRuntimeConfig().public
const insRef = ref<HTMLElement | null>(null)

/** 每种版位预留高度：与 AdSense 常用尺寸对齐，保证布局不跳动 */
const SIZES: Record<string, number> = {
  leaderboard: 90,
  rectangle: 250,
  skyscraper: 600,
  'in-article': 280,
  horizontal: 100,
  multiplex: 320
}

const minHeight = computed(() => SIZES[props.format] ?? 100)

/** 广告单元 ID：组件 props > 版位专属环境变量 > 通用环境变量 */
const CAMEL: Record<string, keyof typeof adsenseSlots> = {
  leaderboard: 'leaderboard',
  rectangle: 'rectangle',
  skyscraper: 'skyscraper',
  'in-article': 'inArticle',
  horizontal: 'horizontal',
  multiplex: 'multiplex'
}

const resolvedSlot = computed(() => {
  if (props.slot) return props.slot
  const key = CAMEL[props.format]
  const perFormat = key && adsenseSlots ? (adsenseSlots as Record<string, string>)[key] : ''
  return perFormat || (adsenseSlot as string) || ''
})

// 三级开关：广告总开关 → AdSense 开关 → 广告单元 ID，全部就绪才输出真实广告位
const isLive = computed(() => Boolean(adsEnabled && adsenseEnabled && adsenseClient && resolvedSlot.value))
// 占位框同样受总开关控制：总开关关闭时整块 v-if 不成立，全站零广告 DOM
const showPlaceholder = computed(() => Boolean(adsEnabled) && import.meta.dev)

onMounted(() => {
  if (!isLive.value || !insRef.value) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
  } catch {
    /* AdSense 尚未就绪时静默忽略 */
  }
})
</script>

<style scoped lang="scss">
.ad-slot {
  width: 100%;
  margin: $spacing-lg 0;
  overflow: hidden;

  &:not(.ad-slot--mobile-hidden) {
    @include mobile {
      display: block;
    }
  }

  &.ad-slot--mobile-hidden {
    @include mobile {
      display: none;
    }
  }

  @include mobile {
    margin: $spacing-md 0;
  }
}

.ad-slot__label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $text-placeholder;
  margin-bottom: $spacing-xs;
  text-align: center;
}

.ad-slot__placeholder {
  @include flex-center;
  flex-direction: column;
  gap: $spacing-sm;
  border: 1px dashed $border-strong;
  border-radius: $radius-md;
  background: repeating-linear-gradient(
    45deg,
    $bg-subtle,
    $bg-subtle 10px,
    rgba(241, 245, 249, 0.4) 10px,
    rgba(241, 245, 249, 0.4) 20px
  );
  color: $text-placeholder;
}

.ad-slot__icon {
  width: 22px;
  height: 22px;
}

.ad-slot__text {
  font-size: $font-size-xs;
  font-family: $font-family-mono;
}

.ad-slot--filled {
  margin: $spacing-lg 0;
}
</style>
