/**
 * i18n 健康检查（开发辅助脚本，不参与构建）
 *
 * 用法：node scripts/verify-i18n.mjs
 *
 * 检查项：
 *  1. 所有 .vue / .ts 中出现的 t('x.y') 静态 key 是否存在于各语言包
 *  2. 12 个语言包的 key 集合是否完全一致（无缺失 / 无多余）
 *  3. 语言包消息中是否含未转义的 vue-i18n 特殊字符（@ | 会破坏编译）
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LOCALE_DIR = join(ROOT, 'i18n', 'locales')

/** 递归收集文件 */
function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.nuxt' || name === '.output' || name.startsWith('.')) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, exts, out)
    else if (exts.some((e) => name.endsWith(e))) out.push(full)
  }
  return out
}

/** 展平嵌套对象为 a.b.c 形式的 key 列表 */
function flatten(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out.push(key)
  }
  return out
}

const localeFiles = readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.json'))
const locales = {}
for (const f of localeFiles) {
  locales[f] = JSON.parse(readFileSync(join(LOCALE_DIR, f), 'utf8'))
}

let failed = false

/* ---------- 1. key 集合一致性 ---------- */
const base = 'en.json'
const baseKeys = new Set(flatten(locales[base]))
console.log(`\n[1] key 集合一致性（基准 ${base}: ${baseKeys.size} 个 key）`)
for (const f of localeFiles) {
  const keys = new Set(flatten(locales[f]))
  const missing = [...baseKeys].filter((k) => !keys.has(k))
  const extra = [...keys].filter((k) => !baseKeys.has(k))
  if (missing.length || extra.length) {
    failed = true
    console.log(`  ✗ ${f}: 缺失 ${missing.length}, 多余 ${extra.length}`)
    if (missing.length) console.log(`      缺失: ${missing.slice(0, 8).join(', ')}`)
    if (extra.length) console.log(`      多余: ${extra.slice(0, 8).join(', ')}`)
  } else {
    console.log(`  ✓ ${f} (${keys.size})`)
  }
}

/* ---------- 2. 源码中使用的 key ---------- */
console.log('\n[2] 源码 t() 静态 key 校验')
const sources = walk(join(ROOT, 'components'), ['.vue'])
  .concat(walk(join(ROOT, 'pages'), ['.vue']))
  .concat(walk(join(ROOT, 'layouts'), ['.vue']))
  .concat(walk(join(ROOT, 'composables'), ['.ts']))
  .concat([join(ROOT, 'app.vue'), join(ROOT, 'error.vue')])

const used = new Set()
const re = /\b(?:t|\$t)\(\s*['"]([A-Za-z0-9_.-]+)['"]/g
for (const file of sources) {
  const src = readFileSync(file, 'utf8')
  let m
  while ((m = re.exec(src))) used.add(m[1])
}

const missingUsed = [...used].filter((k) => !baseKeys.has(k))
if (missingUsed.length) {
  failed = true
  console.log(`  ✗ 源码引用但语言包中不存在的 key (${missingUsed.length}):`)
  for (const k of missingUsed) console.log(`      ${k}`)
} else {
  console.log(`  ✓ 源码共使用 ${used.size} 个 key，全部存在`)
}

/* ---------- 3. 特殊字符 ---------- */
console.log('\n[3] vue-i18n 特殊字符检查（未转义的 @ 会破坏消息编译）')
const special = []
for (const f of localeFiles) {
  for (const k of flatten(locales[f])) {
    const v = k.split('.').reduce((o, p) => (o ? o[p] : undefined), locales[f])
    if (typeof v === 'string') {
      // 已转义的 {'@'} 是合法的，先移除再检测
      const cleaned = v.replace(/\{'@'\}/g, '')
      if (cleaned.includes('@')) special.push(`${f} → ${k}: ${v}`)
    }
  }
}
if (special.length) {
  failed = true
  console.log(`  ✗ 发现 ${special.length} 处未转义 @：`)
  for (const s of special) console.log(`      ${s}`)
} else {
  console.log('  ✓ 未发现未转义的 @')
}

console.log(failed ? '\n结果：存在问题 ✗\n' : '\n结果：全部通过 ✓\n')
process.exit(failed ? 1 : 0)
