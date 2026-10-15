# FreeTools — 多语言在线工具站

纯前端的在线工具站，面向海外发达国家，通过自然搜索流量 + Google AdSense 变现。
全站 **SSR + 预渲染静态化**，12 种语言，极致 SEO。

> 技术栈：Nuxt 4 · Vue 3 · TypeScript · SCSS · @nuxtjs/i18n
> 无后端、无埋点、无意见反馈、无任何数据上报 —— 所有工具逻辑 100% 在浏览器本地执行。

---

## 一、快速开始

```bash
pnpm install     # 安装依赖（会自动执行 nuxt prepare）
pnpm dev         # 本地开发，http://localhost:3000
pnpm generate    # 生产构建 + 全站静态化（输出 dist/ ，396 个 HTML）
pnpm preview     # 预览静态产物，http://localhost:3000
```

Node 版本要求：**>= 20**。

### ⚠️ 静态产物必须通过 HTTP 访问，不能双击 HTML

`pnpm generate` 产出的是纯静态文件（`dist/`）。它是带客户端路由的单页应用，
**必须由 HTTP 服务器托管**。直接双击 `dist/index.html` 用 `file://` 协议打开会必然失效：

| 现象 | 原因 |
| --- | --- |
| 页面能显示，但所有按钮/下拉都没反应 | 资源路径是 `/_nuxt/xxx.js`，在 `file://` 下被解析为 `file:///C:/_nuxt/...`，全部加载失败，JS 一行都没执行 |
| 点站内链接报 "无法访问文件 / ERR_FILE_NOT_FOUND" | 站内链接是 `/tool/json-formatter`，在 `file://` 下被解析为本地磁盘路径 `file:///C:/tool/json-formatter`，该文件不存在 |

正确做法（任选其一）：

```bash
pnpm preview                                   # 内置零依赖静态服务器，默认 http://localhost:3000
pnpm preview --port 8080                       # 指定端口
pnpm preview --host 0.0.0.0 --port 8080        # 局域网/手机同网段访问
```

也可以交给任意静态服务器，把根目录指向 `dist/` 即可：
`npx serve dist` · `python -m http.server -d dist 8000` · VS Code Live Server。

> 部署到真实的静态托管（Cloudflare Pages / Netlify / Nginx）时同样天然满足这一条件，
> 只要发布目录是 `dist/`（等价于 `.output/public/`）即可。

---

## 二、环境变量

复制 `.env.example` 为 `.env`（本地）或直接在部署平台配置：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NUXT_PUBLIC_SITE_URL` | ✅ | 站点真实域名，**决定 canonical / hreflang / sitemap / 结构化数据**。上线前务必改为线上域名 |
| `NUXT_PUBLIC_BRAND` | | 品牌名，默认 `FreeTools` |
| `NUXT_PUBLIC_ADS_ENABLED` | ★ 广告总开关 | 默认 `false`。关闭时全站**不输出任何广告 DOM**（含开发占位框、`ads.txt`）。流量达标后置 `true` 并重新构建即可上线全部预留版位 |
| `NUXT_PUBLIC_ADSENSE_CLIENT` | 变现必填 | AdSense 发布商 ID，形如 `ca-pub-1234567890123456` |
| `NUXT_PUBLIC_ADSENSE_ENABLED` | 变现必填 | 填 `true` 后广告脚本才会真正加载 |
| `NUXT_PUBLIC_ADSENSE_SLOT` | 变现必填 | 通用广告单元 ID（数字），全站版位复用 |
| `NUXT_PUBLIC_ADSENSE_SLOT_*` | 可选 | 各版位专属单元 ID（`LEADERBOARD`/`RECTANGLE`/`SKYSCRAPER`/`IN_ARTICLE`/`HORIZONTAL`/`MULTIPLEX`），留空回落到通用值 |
| `NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | 可选 | Search Console 校验码 |
| `NUXT_PUBLIC_ANALYTICS_PROVIDER` | 可选 | `ga4` / `plausible` / 留空 |
| `NUXT_PUBLIC_ANALYTICS_ID` | 可选 | 对应统计平台的 ID |

### 广告当前状态：已隐藏

`NUXT_PUBLIC_ADS_ENABLED` 默认为 `false`，**10 个预留版位的代码与布局都保留在模板中，但不会输出任何 DOM** —— 页面里既没有占位框，也没有第三方广告脚本，不影响布局、性能与 AdSense 之外的任何行为。

流量达标后上线只需四步（全部在 `.env` 或部署平台配好变量后**重新构建**）：

```
NUXT_PUBLIC_ADS_ENABLED=true
NUXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NUXT_PUBLIC_ADSENSE_SLOT=1234567890
NUXT_PUBLIC_ADSENSE_ENABLED=true
```

> ⚠️ **本站是全站静态预渲染（SSG），所有 `NUXT_PUBLIC_*` 变量都在构建时写入 HTML。**
> 因此修改 `NUXT_PUBLIC_SITE_URL` 或任何广告变量后，**必须重新构建**才会生效；
> 仅在部署平台改环境变量而不重新构建是无效的。

---

## 三、多语言与 URL 结构

采用 `prefix_except_default` 策略：**默认语言英语无前缀**，其余语言带前缀，对 SEO 最友好。

| 语言 | 代码 | URL 前缀 |
| --- | --- | --- |
| English（默认） | `en` | `/` |
| Deutsch | `de` | `/de` |
| Français | `fr` | `/fr` |
| Español | `es` | `/es` |
| Italiano | `it` | `/it` |
| Português | `pt` | `/pt` |
| Nederlands | `nl` | `/nl` |
| Русский | `ru` | `/ru` |
| 日本語 | `ja` | `/ja` |
| 한국어 | `ko` | `/ko` |
| 简体中文 | `zh-CN` | `/zh-CN` |
| 繁體中文 | `zh-TW` | `/zh-TW` |

- 语言包位置：`i18n/locales/*.json`（**每个文件 434 个 key，完全对齐**）
- 浏览器首次访问按 `Accept-Language` 自动跳转，之后用 cookie 记住选择
- 每页均输出完整的 `hreflang` 互链 + `x-default`

### 新增 / 修改词条

1. 编辑 `i18n/locales/en.json`（基准文件）
2. 同步其余 11 个语言文件
3. 运行自检脚本：

```bash
node scripts/verify-i18n.mjs
```

该脚本会校验：key 集合一致性、源码中 `t('x')` 引用的 key 是否存在、消息中是否含未转义的 `@`（vue-i18n 的 `@` 是链接消息语法，字面量需写成 `{'@'}`）。

---

## 四、SEO 已实现清单

| 项目 | 实现方式 |
| --- | --- |
| 全站静态预渲染 | 33 条基础路由 × 12 语言 = **396 个静态 HTML**，见 `nuxt.config.ts` 的 `PRERENDER_ROUTES` |
| 标题 / 描述 / 关键词 | 每工具、每语言独立文案，见语言包 `tools.<slug>.seoTitle/seoDescription/keywords` |
| canonical | 每页自指 canonical，含语言前缀 |
| hreflang | 每页输出全部 12 种语言互链 + `x-default`，`useSeoHead()` 统一处理 |
| Open Graph / Twitter Card | 含 `og:image`（`public/og-image.png`，1200×630）、`og:locale` |
| 结构化数据 JSON-LD | `Organization`、`WebSite`+`SearchAction`、`ItemList`、`CollectionPage`、`BreadcrumbList`、`WebApplication`、`HowTo`、`FAQPage` |
| sitemap.xml | 动态生成，396 条 URL，每条含完整 `xhtml:link` 多语言互链，见 `server/routes/sitemap.xml.ts` |
| robots.txt | 动态生成，放行主流搜索与 AI 抓取，声明 sitemap |
| ads.txt | 动态生成，配置 AdSense 后自动输出 `google.com, pub-xxx, DIRECT, ...`，未配置时返回 404 |
| 语义化与可访问性 | 单一 `h1`、`main`/`nav`/`footer` 语义标签、skip-link、`aria-*`、图片 `alt` |
| 内链结构 | 首页 → 分类页 → 工具页 → 相关工具（同分类优先），面包屑全链路可爬 |
| 404 处理 | 抛 `fatal` 404 并输出 `noindex, follow` |

---

## 五、广告位

> 🔕 **当前状态：全部隐藏。** `NUXT_PUBLIC_ADS_ENABLED=false` 时 `AdSlot` 整个根节点 `v-if` 不成立，
> 10 个版位都不输出任何 DOM —— 页面中没有占位框、没有 `adsbygoogle` 元素、没有第三方脚本。
> 版位代码与布局位置全部保留，流量达标后打开总开关即可原样上线。

广告位组件：`components/ads/AdSlot.vue`，已内置 **CLS 防护**（每种尺寸预留固定高度）。

```vue
<AdSlot format="leaderboard" />   <!-- 页头横幅 -->
<AdSlot format="in-article" />    <!-- 正文中 -->
<AdSlot format="horizontal" />    <!-- 页尾 -->
<AdSlot format="skyscraper" />    <!-- 侧栏竖幅 -->
<AdSlot format="rectangle" />     <!-- 方形 -->
<AdSlot format="multiplex" />     <!-- 多路复用 -->
```

当前布局位置：

- **首页**：`leaderboard` + `horizontal`
- **分类页 / 全部工具页**：`leaderboard`
- **工具详情页**：`leaderboard` + `in-article` + `horizontal`
- **左右侧栏**：`skyscraper`（窄屏自动隐藏）
- **页脚**：`leaderboard`

部分交互密集的工具可通过 `data/tools.ts` 中的 `ads: false` 单独关闭工具页广告。

---

## 六、目录结构

```
├── assets/scss/          # 设计 token（variables / mixins / global）
├── components/
│   ├── ads/AdSlot.vue    # 广告位（已预留尺寸）
│   ├── common/           # SearchBar / ToolCard / Breadcrumbs / CopyButton / ToolField / ResultBox
│   ├── layout/           # AppHeader / AppSidebar / AppFooter / LocaleSwitcher
│   └── tools/            # 24 个工具组件
├── composables/          # useSeoHead / useToolsData / useUiState / useCopy / useFileDownload / useImageUtils
├── data/tools.ts         # 工具注册表（单一数据源）
├── i18n/locales/*.json   # 12 个语言包
├── layouts/default.vue   # 三段式栅格：侧栏 + 正文 + 广告栏
├── pages/
│   ├── index.vue         # 首页（含站内搜索）
│   ├── all-tools.vue     # 全部工具
│   ├── category/[category].vue
│   └── tool/[slug].vue   # 工具详情（含 HowTo / FAQ / 相关工具）
├── scripts/
│   ├── generate-og-image.mjs  # 零依赖生成 og-image.png
│   └── verify-i18n.mjs        # 语言包自检
├── server/routes/        # sitemap.xml / robots.txt / ads.txt
└── utils/image.ts        # Canvas 图片处理能力
```

---

## 七、工具清单（24 个 / 7 大类）

| 分类 | 工具 |
| --- | --- |
| 开发者 | JSON 格式化、JSON 转 TypeScript、正则测试、JWT 解析、哈希生成（MD5/SHA/HMAC）、时间戳转换 |
| 文本 | 字数统计、大小写转换、Markdown 预览、Lorem Ipsum、文本对比 |
| 编码 | Base64、URL 编解码、HTML 实体 |
| 生成器 | UUID、密码生成、二维码 |
| 图片 | 图片压缩、格式转换、尺寸调整 |
| PDF | 合并、拆分、压缩 |
| 设计 | 颜色转换（HEX/RGB/HSL + 明暗色阶 + 对比度） |

### 新增一个工具

1. 在 `data/tools.ts` 的 `TOOLS` 中追加一项（`slug` / `category` / `icon` / `component`）
2. 在 `components/tools/` 新建同名组件
3. 在 `pages/tool/[slug].vue` 的 `components` 映射表中注册异步引入
4. 在 12 个语言包的 `tools` 下补齐该 slug 的 `name`/`short`/`seoTitle`/`seoDescription`/`keywords`
5. 在 `nuxt.config.ts` 的 `BASE_ROUTES` 会自动带上（由 `TOOLS` 推导，无需手改）
6. `node scripts/verify-i18n.mjs` 自检

---

## 八、部署

**推荐用 `pnpm generate`**，产出纯静态站点，可直接丢到任意静态托管：

| 产物 | 说明 |
| --- | --- |
| `dist/` | 纯静态站点（= `.output/public/`），396 个 HTML + 全部静态资源 |
| `.output/public/` | 同上（`dist` 是它的软链接） |

### 静态托管（推荐，成本最低）

Cloudflare Pages / Netlify / GitHub Pages / 对象存储 CDN 等：

```
构建命令：pnpm generate
发布目录：dist
```

托管平台需满足一个条件：**目录请求能自动回落到该目录下的 `index.html`**
（即 `/tool/json-formatter/` → `/tool/json-formatter/index.html`）。
Cloudflare Pages、Netlify、Vercel、GitHub Pages、Nginx（`index index.html;`）默认都满足。
产物中已包含 `404.html` 与 `200.html`，供平台做错误页与回退。

### Node 托管

也可以先 `pnpm build` 得到 Nitro 服务端产物：

```
构建命令：pnpm build
启动命令：node .output/server/index.mjs
```

> 本项目全站预渲染，静态托管与 Node 托管的内容完全一致，静态托管更省成本、TTFB 更低。

### 上线后必做

1. 把 `NUXT_PUBLIC_SITE_URL` 改成真实域名后重新构建（否则 canonical/sitemap 指向错误域名）
2. 在 Google Search Console 提交 `https://你的域名/sitemap.xml`
3. 申请 AdSense，拿到 `ca-pub-xxx` 后填入环境变量并开启
4. 部署完成后访问 `/ads.txt` 确认输出正确

---

## 九、质量自检

```bash
node scripts/verify-i18n.mjs   # 语言包完整性 / 缺失 key / 特殊字符
pnpm build                     # 类型检查 + 预渲染（应生成 396 个 HTML）
```

构建后会看到 `Prerendered 398 routes`（396 页面 + sitemap + robots），且不应出现 `[500] Server Error`。
