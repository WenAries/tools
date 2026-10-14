<template>
  <div class="tool">
    <div class="tool__bar">
      <div class="tool__tabs">
        <button
          v-for="v in views"
          :key="v"
          type="button"
          class="tool__tab"
          :class="{ 'is-active': view === v }"
          @click="view = v"
        >
          {{ v === 'split' ? t('ui.splitView') : v === 'edit' ? t('ui.markdownInput') : t('ui.preview') }}
        </button>
      </div>
      <div class="tool__bar-actions">
        <CopyButton :value="() => markdown" :label="t('ui.markdownInput')" />
        <CopyButton :value="() => html" :label="t('ui.exportHtml')" />
        <button type="button" class="tool__dl" @click="exportMd">{{ t('ui.exportMarkdown') }}</button>
      </div>
    </div>

    <div class="tool__panes" :class="`tool__panes--${view}`">
      <textarea v-model="markdown" class="tool__editor" spellcheck="false" />
      <!-- eslint-disable-next-line vue/no-v-html —— 渲染结果来自 markdown-it，已开启 html:false 过滤原始 HTML -->
      <div class="tool__preview" v-html="html" />
    </div>

    <p class="tool__meta">{{ t('ui.words') }}: {{ wordCount }}</p>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'

const { t } = useI18n()
const { downloadText } = useFileDownload()

const md: MarkdownIt = new MarkdownIt({ html: false, linkify: true, typographer: true })

const markdown = ref(`# Hello Markdown

Write **bold**, _italic_ and \`inline code\` on the left — the result renders instantly.

## Features

- Headings, lists and task lists
- [Links](https://example.com) and images
- Tables and blockquotes

| Tool | Free | Private |
| ---- | :--: | :--: |
| JSON formatter | ✅ | ✅ |
| PDF merge | ✅ | ✅ |

> Everything runs in your browser.

\`\`\`js
const answer = 42;
\`\`\`

- [x] Render Markdown
- [ ] Ship it
`)

const view = ref<'split' | 'edit' | 'preview'>('split')
const views = ['split', 'edit', 'preview'] as const

const html = computed(() => md.render(markdown.value))
const wordCount = computed(() => (markdown.value.trim().match(/[\p{L}\p{N}'’_-]+/gu) || []).length)

function exportMd() {
  downloadText(markdown.value, 'document.md', 'text/markdown;charset=utf-8')
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/variables' as *;

.tool {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tool__bar {
  @include flex-between;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.tool__tabs {
  @include flex-start;
  gap: 2px;
  padding: 3px;
  background: $bg-subtle;
  border-radius: $radius-sm;
}

.tool__tab {
  @include button-base;
  padding: 5px $spacing-md;
  font-size: $font-size-sm;
  background: transparent;
  color: $text-secondary;

  &.is-active {
    background: $bg-white;
    color: $accent-color;
    box-shadow: $shadow-xs;
  }
}

.tool__bar-actions {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
}

.tool__dl {
  @include button-ghost;
  font-size: $font-size-sm;
  padding: 5px $spacing-sm;
}

.tool__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;

  &--edit {
    grid-template-columns: 1fr;

    .tool__preview {
      display: none;
    }
  }

  &--preview {
    grid-template-columns: 1fr;

    .tool__editor {
      display: none;
    }
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.tool__editor {
  @include input-base;
  min-height: 440px;
  resize: vertical;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  line-height: 1.7;
}

.tool__preview {
  @include surface;
  min-height: 440px;
  padding: $spacing-lg;
  overflow: auto;
  max-height: 70vh;
  font-size: $font-size-base;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 1.2em 0 0.5em;
    line-height: 1.3;
  }

  :deep(h1) { font-size: 1.6em; }
  :deep(h2) { font-size: 1.35em; }
  :deep(h3) { font-size: 1.15em; }

  :deep(p) { margin: 0.7em 0; line-height: 1.75; }

  :deep(ul),
  :deep(ol) { padding-left: 1.4em; margin: 0.6em 0; }

  :deep(li) { margin: 0.25em 0; }

  :deep(blockquote) {
    margin: 0.9em 0;
    padding: 0.5em 1em;
    border-left: 3px solid $accent-color;
    background: $brand-50;
    border-radius: 0 $radius-sm $radius-sm 0;
    color: $text-secondary;
  }

  :deep(code) {
    padding: 2px 5px;
    background: $bg-subtle;
    border-radius: 3px;
    font-family: $font-family-mono;
    font-size: 0.9em;
  }

  :deep(pre) {
    margin: 0.9em 0;
    padding: $spacing-md;
    background: #0f172a;
    border-radius: $radius-sm;
    overflow: auto;
  }

  :deep(pre code) {
    background: transparent;
    color: #e2e8f0;
    padding: 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.9em 0;
    font-size: 0.95em;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid $border-color;
    padding: 7px 10px;
    text-align: left;
  }

  :deep(th) { background: $bg-subtle; }

  :deep(a) { color: $accent-color; }

  :deep(img) { max-width: 100%; }

  :deep(hr) {
    border: none;
    border-top: 1px solid $border-color;
    margin: 1.2em 0;
  }
}

.tool__meta {
  font-size: $font-size-xs;
  color: $text-muted;
}
</style>
