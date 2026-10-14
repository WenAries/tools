export type ToolStatusState = 'busy' | 'success' | 'error' | 'warning'

/**
 * 工具操作反馈（纯前端工具的统一交互反馈）
 *
 * 用法：
 *   const { state, message, progress, isBusy, setBusy, setProgress, setSuccess, setError, setWarning } = useToolStatus()
 * 模板中配合 <ToolStatus :state="state" :message="message" :progress="progress" /> 渲染。
 *
 * 注意：这些方法只在事件回调里调用，SSR 阶段不会执行，因此不存在水合不一致问题。
 */
export function useToolStatus() {
  const { t } = useI18n()

  const state = ref<ToolStatusState>('busy')
  const message = ref('')
  const progress = ref('')
  // 处理中标记与展示状态分离：初值必须为 false，否则按钮在页面初次加载时就被禁用
  const running = ref(false)

  const isBusy = computed(() => running.value)

  /** 开始处理：立即给出可见反馈，并显示 0 / total 进度 */
  function setBusy(total: number) {
    running.value = true
    state.value = 'busy'
    message.value = t('ui.processingImages', { count: total })
    progress.value = `0 / ${total}`
  }

  /** 单张处理完成，刷新进度 */
  function setProgress(done: number, total: number) {
    progress.value = `${done} / ${total}`
  }

  /** 全部成功；extra 用于附加信息（如图片压缩的整体节省比例） */
  function setSuccess(count: number, extra?: string) {
    running.value = false
    state.value = 'success'
    const base = t('ui.processedOk', { count })
    message.value = extra ? `${base} · ${extra}` : base
    progress.value = ''
  }

  function setError(count: number) {
    running.value = false
    state.value = 'error'
    message.value = t('ui.processedFail', { count })
    progress.value = ''
  }

  /** 提示类信息，key 取 ui.* 下的名称，如 selectImagesFirst / skippedUnsupported */
  function setWarning(key: string, params: Record<string, unknown> = {}) {
    running.value = false
    state.value = 'warning'
    message.value = t(`ui.${key}`, params)
    progress.value = ''
  }

  function reset() {
    running.value = false
    message.value = ''
    progress.value = ''
  }

  return { state, message, progress, isBusy, setBusy, setProgress, setSuccess, setError, setWarning, reset }
}
