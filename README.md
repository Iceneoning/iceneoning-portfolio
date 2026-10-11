# ICE Portfolio

Unreal Engine / C++ Gameplay Engineering 个人作品集。独立于 Fuwari 博客部署。

2026-10-11 内容更新：Challenge / FPS 代表作已补充技术案例，BoardLine 已按当前 C++ 工程补充技术章节。三部作品的完整演示视频与 BoardLine 主视觉已经压缩并接入；媒体路径约定见 [作品媒体接入说明](docs/content/06-project-media-and-details.md)，压缩参数与原文件保存位置见 [媒体优化记录](docs/content/09-media-optimization.md)。

## 当前阶段

V8 已迁移至正式 Astro 源码（2026-10-09）。依赖安装、类型检查与静态构建已完成；首页和两部独立案例已在 1440px / 390px 浏览器中检查。公开的 UE 截图、视频与工程证据仍待补，页面明确标注资料状态。详细结果见 [V8 Astro 验收记录](docs/implementation/05-v8-astro-acceptance.md)。

同日根据用户反馈完成一轮美术打磨：重绘更纤细的六向冰晶，收紧首页节奏，优化作品卡片层次。当前 SVG 已不同于初始 V8 原型；原型保留作历史参考。见 [视觉打磨记录](docs/implementation/06-visual-refinement.md)。

随后按用户「运用计算机图形学写 shader」的要求尝试冰晶 GLSL 光照，记录见 [Shader 冰晶记录](docs/implementation/07-shader-crystal.md)。该版本随后被用户要求重新设计，当前页面已停止引用其组件、脚本和样式。

**当前版本：Winter Atelier / 冬日世界工坊（2026-10-09）。** 用户认为上一轮仍然没有美感，本轮停止引用晶体与网格概念图，改为专门生成的冬日场景插画、深蓝宋体标题与暖白底色。首屏以雪中工坊与阶梯为主视觉，作品区并列展示雪中聚落与冬日档案馆概念封面；案例页延续对应画面。插画明确标注为 AI 概念美术、非 UE 实机。当前实现和验收以 [冬日工坊实施记录](docs/implementation/10-winter-atelier.md) 与 [设计约定](docs/design/17-winter-atelier.md) 为准；05—09 是历史记录。

信息架构保留「让规则凝成世界。」＋「作品选集。」与 RTS / Blitz Archive 独立案例页。两部案例首屏与页尾均有具名的「下一部作品」入口。未补齐的真实 UE 媒体与工程证据继续明确标注。

## 技术栈

- Astro 6，静态生成；Node.js 22+
- TypeScript，Content Collections / Zod，MDX
- Tailwind CSS 4（Vite 插件），定制 CSS 为主
- 原生跨文档链接，无 SPA 路由；首页、案例页、404 均无客户端脚本；未启用 View Transitions
- 明亮冬日 CSS + AI 概念插画；Astro Image / Sharp 输出响应式 WebP；仅小型品牌标记呼吸与克制的图片 hover；降低动效偏好下关闭动画、过渡、位移和平滑滚动

## 本地开发与构建

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm verify:build
pnpm dev
```

Node.js 22.12+、pnpm 10.28.1。已有 `pnpm-lock.yaml`，使用锁文件重现依赖。Astro 默认从 `http://127.0.0.1:4321/` 启动；端口被占用时自动递增，以终端输出为准。本次运行的开发地址为 `http://127.0.0.1:4322/`，构建预览为 `http://127.0.0.1:4323/`。静态产物在 `dist/`。

使用 `pnpm preview --port 4323` 启动构建预览，之后可执行 `pnpm verify:build http://127.0.0.1:4323/`，同时检查静态链接、锚点、HTTP 路由与资源。浏览器截图及实测记录在 `docs/implementation/qa-v8-astro/`。

## 内容与路由

发布文件单个不得超过 25 MiB。`pnpm verify:build` 会检查 `dist/` 中每个文件的字节数。原始视频和封面保存在本地 `media-source/`，该目录已被 Git 忽略，也不会进入 Astro 发布产物。`scripts/optimize-media.mjs` 使用系统 FFmpeg 做 H.264 / AAC 双遍编码、MP4 faststart，以及 Sharp WebP 压缩；对已有发布文件和备份拒绝覆盖。

- `/`：冬日工坊首页、首屏项目入口和作品选集。
- `/projects/rts-gameplay-systems/`：RTS 独立案例。
- `/projects/blitz-archive/`：Blitz Archive 独立案例。
- `src/content/projects/*.mdx`：每部作品的内容来源；`src/content.config.ts` 校验必需字段。
- `src/lib/projects.ts`：过滤草稿、统一排序和项目链接；新增合法 MDX 自动生成页面并进入换片顺序。
- `src/layouts/ProjectLayout.astro`：独立案例模板，目录从 MDX 标题生成；媒体仅在 `mediaApproved`、`cover`、`coverAlt` 齐备后显示。
- `src/styles/winter.css`：当前整站排版、组件样式与响应式规则；`public/visuals/ice-mark.svg`：原创小型雪花标记。
- `src/components/PortfolioArtwork.astro`：共享响应式概念插画组件；`src/assets/atelier/`：三个插画源文件、来源说明和完整生成提示词。
- `src/components/ConceptArt.astro`：上一轮几何插画组件，保留但当前页面不引用。
- `src/styles/emblem.css`、`src/components/WinterCrystal.astro`、`src/lib/crystal-geometry.ts`、`src/shaders/winter-crystal.frag`、`src/scripts/winter-crystal.ts`：上一轮实现，保留但当前页面不引用。
- `src/pages/visuals/winter-crystal.svg.ts`：上一轮静态资源生成路由，仍可构建，但不用于当前页面。
- `src/pages/404.astro`：找不到页面的处理。

## 当前视觉基准与原型

- `docs/design/17-winter-atelier.md`：当前冬日工坊视觉约定；15—16 是历史记录。
- `docs/prototypes/cinema-v8/index.html`：V8 历史参考原型；正式网站运行不依赖这个目录。
- `docs/prototypes/cinema-v8/base.css`：从 V7 保留的明亮晨光排版，已经复制到 V8 内部；删除旧版不会影响。
- `docs/design/14-v8-winter-emblem.md`：原始 V8 合同；其视觉方案已由用户最新重设计请求及 17 号文档替代，技术事实与安全边界继续有效。
- `docs/implementation/04-codex-v8-handoff.md`：交给 Codex 的正式 Astro 迁移任务书。

正式源码已替换旧深色视觉依赖；本次验收针对 Astro 的 `dist/`，未借用原型测试结论。旧公共资产保留以保护已有文件，但当前页面不引用它们。所有 UE 项目截图与技术事实都必须有真实依据。

部署、DNS、博客入口和磁盘映射均未修改。
