# 18 · 二次元主题与看板娘「冰霓」（V0.5）

## 目标

在保留现有信息架构（分区锚点、游戏放映厅、案例页、播放器）的前提下，让作品集更好看、更有互动，并提高二次元浓度。

## 素材

| 文件 | 用途 | 说明 |
| --- | --- | --- |
| `src/assets/anime/hero-snow.webp` | 首页首屏主视觉 | 站长提供（`media-source/anime/鞠姐.jpg`），2:3 竖幅，无损 WebP |
| `src/assets/anime/about-mika.jpg` | 关于区插画 | 站长提供（`media-source/anime/Mika.png`，作者 @omrice4869），16:9 |
| `src/assets/anime/chibi.png` | 右下角看板娘 | 透明 PNG |
| `src/assets/anime/chibi-{games,graphics,frontend,backend,misc}.png` | 分区卡片与分区标题贴纸 | 透明 PNG |
| `src/assets/anime/chibi-404.png` | 404 页 | 透明 PNG |

- 全部为 AI 绘制的原创角色，不使用现有 IP；页面在首屏和关于区标注「AI 绘制 · 原创看板娘」。
- 原图保存在被 Git 忽略的 `media-source/anime/`。
- 更换 Q 版图片：准备纯白底图片后执行 `node scripts/cutout-anime.mjs <输入> src/assets/anime/<文件名>.png 640`，脚本只去除与边缘连通的白色，角色描边内的白色衣服会保留。
- 引用集中在 `src/lib/anime-art.ts`，保持文件名不变即可直接替换。

## 组件

- `AnimeHero.astro`：插画卡片（指针 3D 视差、光泽、浮动标签）、打字机角色文案、可点击的对话气泡、作品统计。
- `SectionCards.astro`：五个 Q 版分区卡片，替代原 `ArchiveIndex`。
- `ProjectSection.astro` / `ProjectShowcase.astro`：标题加入 Q 版贴纸和英文副标题；卡片倾斜与高光；放映厅增加圆点切换。
- `Mascot.astro` + `src/scripts/anime-fx.ts`：全站唯一新增脚本，负责滚动渐显、倾斜、打字机、飘雪（DOM 雪花，不使用 canvas）、点击粒子和看板娘台词。
- 配色与全局样式：`src/styles/anime.css`（在 `winter.css` 之后加载）。

## 交互与可访问性

- 看板娘：问候语按时间段变化；首页进入分区、悬停/聚焦卡片时说对应台词；案例页读到底部时提示上一部/下一部作品；可收起，状态存储于 `localStorage`。
- 飘雪开关、回到顶部按钮都在看板娘旁边，均有可读名称和 `aria-pressed` 状态。
- `prefers-reduced-motion: reduce` 时：关闭飘雪、粒子、渐显、倾斜与所有动画。
- 渐显使用 `translate` 属性，不与卡片 `transform` 倾斜冲突。

## 验收脚本调整

`scripts/verify-build.mjs`：每页预期脚本数 +1（看板娘模块），检查看板娘与雪层存在；原「作品索引单选」检查替换为「分区卡片覆盖全部分类」和「首屏插画已标注 AI 绘制」。
