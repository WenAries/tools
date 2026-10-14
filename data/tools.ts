/**
 * 工具站静态注册表（纯前端，无后端依赖）
 * - 工具名称/描述/SEO 文案全部来自 i18n 语言包，key 为 slug
 * - component 字段对应 components/tools/<name>.vue
 */

export type CategoryKey =
  | 'developer'
  | 'text'
  | 'encoding'
  | 'generator'
  | 'design'
  | 'image'
  | 'pdf'

export interface CategoryDef {
  key: CategoryKey
  icon: string
}

export interface ToolDef {
  /** URL 片段，同时作为 i18n key */
  slug: string
  category: CategoryKey
  /** emoji 图标 */
  icon: string
  /** components/tools 下的组件名 */
  component: string
  /** 是否为主要工具（首页优先展示） */
  featured?: boolean
  /** 工具页是否允许出现广告（部分工具交互密集，可关闭） */
  ads?: boolean
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'developer', icon: '⌨️' },
  { key: 'text', icon: '📝' },
  { key: 'encoding', icon: '🔐' },
  { key: 'generator', icon: '🎲' },
  { key: 'image', icon: '🖼️' },
  { key: 'pdf', icon: '📄' },
  { key: 'design', icon: '🎨' }
]

export const TOOLS: ToolDef[] = [
  // ---------------- Developer ----------------
  { slug: 'json-formatter', category: 'developer', icon: '🧩', component: 'JsonFormatter', featured: true },
  { slug: 'json-to-typescript', category: 'developer', icon: '🔷', component: 'JsonToTypescript' },
  { slug: 'regex-tester', category: 'developer', icon: '🔍', component: 'RegexTester', featured: true },
  { slug: 'jwt-decoder', category: 'developer', icon: '🎫', component: 'JwtDecoder' },
  { slug: 'hash-generator', category: 'developer', icon: '🔒', component: 'HashGenerator', featured: true },
  { slug: 'timestamp-converter', category: 'developer', icon: '⏱️', component: 'TimestampConverter', featured: true },

  // ---------------- Text ----------------
  { slug: 'word-counter', category: 'text', icon: '📊', component: 'WordCounter', featured: true },
  { slug: 'case-converter', category: 'text', icon: '🔤', component: 'CaseConverter', featured: true },
  { slug: 'markdown-preview', category: 'text', icon: '📖', component: 'MarkdownPreview' },
  { slug: 'lorem-ipsum-generator', category: 'text', icon: '📰', component: 'LoremIpsumGenerator' },
  { slug: 'text-diff', category: 'text', icon: '🆚', component: 'TextDiff', featured: true },

  // ---------------- Encoding ----------------
  { slug: 'base64-encoder', category: 'encoding', icon: '🔡', component: 'Base64Encoder', featured: true },
  { slug: 'url-encoder', category: 'encoding', icon: '🔗', component: 'UrlEncoder', featured: true },
  { slug: 'html-entity-encoder', category: 'encoding', icon: '🏷️', component: 'HtmlEntityEncoder' },

  // ---------------- Generator ----------------
  { slug: 'uuid-generator', category: 'generator', icon: '🆔', component: 'UuidGenerator', featured: true },
  { slug: 'password-generator', category: 'generator', icon: '🔑', component: 'PasswordGenerator', featured: true },
  { slug: 'qr-code-generator', category: 'generator', icon: '📱', component: 'QrCodeGenerator', featured: true },

  // ---------------- Image ----------------
  { slug: 'image-compressor', category: 'image', icon: '🗜️', component: 'ImageCompressor', featured: true },
  { slug: 'image-converter', category: 'image', icon: '🔄', component: 'ImageConverter', featured: true },
  { slug: 'image-resizer', category: 'image', icon: '📐', component: 'ImageResizer' },

  // ---------------- PDF ----------------
  { slug: 'pdf-merge', category: 'pdf', icon: '📎', component: 'PdfMerge', featured: true },
  { slug: 'pdf-split', category: 'pdf', icon: '✂️', component: 'PdfSplit', featured: true },
  { slug: 'pdf-compress', category: 'pdf', icon: '📦', component: 'PdfCompress', featured: true },

  // ---------------- Design ----------------
  { slug: 'color-converter', category: 'design', icon: '🎨', component: 'ColorConverter', featured: true }
]

export const TOOL_SLUGS = TOOLS.map((t) => t.slug)

export function getToolBySlug(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug)
}

export function getToolsByCategory(category: CategoryKey): ToolDef[] {
  return TOOLS.filter((t) => t.category === category)
}

export function getFeaturedTools(): ToolDef[] {
  return TOOLS.filter((t) => t.featured)
}

/** 相关工具：同分类优先，不足时用 featured 补齐 */
export function getRelatedTools(slug: string, limit = 6): ToolDef[] {
  const current = getToolBySlug(slug)
  if (!current) return []
  const sameCategory = TOOLS.filter((t) => t.category === current.category && t.slug !== slug)
  const others = TOOLS.filter((t) => t.category !== current.category && t.slug !== slug && t.featured)
  return [...sameCategory, ...others].slice(0, limit)
}
