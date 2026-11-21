# V0.4 — Creative Archive / 创作档案

网站身份：ICE / CREATIVE ARCHIVE（冰霓 · 创作档案）。游戏工程仍是重点，但不再是唯一收录领域。

## 首页布局

分区吸顶导航 → Hero（分区直达按钮）→ 游戏（电影式放映厅）→ 图形学与渲染 → 前端开发 → 后端开发 → 杂项 → 关于。
游戏分区保留旧电影式放映厅的中央突出、侧翼倾斜及视口范围内滚轮切换逻辑。

## 分区 ID

| category | 中文名 | 收录内容 |
| --- | --- | --- |
| `games` | 游戏 | 游戏项目、玩法 Demo、Mod |
| `graphics` | 图形学与渲染 | 光栅化、Shader、材质与渲染研究 |
| `frontend` | 前端开发 | 互动叙事、Web 动效与回放导出 |
| `backend` | 后端开发 | 服务端、接口、数据库等工程 |
| `misc` | 杂项 | 小型工具、课程实验与其他创作 |

分区名称、显示顺序、导航锚点统一由 `src/config/project-sections.ts` 配置。

## 添加作品

1. 在 `src/content/projects/` 增加唯一 ID 的 MDX。填好 `category`、`order`、`title`、`summary` 和其余 schema 必填项。团队项目可用 `role` 和 `personalScope` 记录职责，小实验可省略。
2. 非游戏项目可用 `stack` 记录技术栈。项目时间用 `month`（如 `'2025-03'`），跨月可加 `endMonth`。只确认到年份时填 `year`。
3. 新项目可先用 `draft: true` 整理资料；设为 `draft: false` 后自动进入对应展区，不需要改首页组件。
4. 媒体依照 `public/media/projects/<id>/` 约定。技术案例可直接使用文字卡片。详情页在有视频时显示播放器，开发中的游戏项目可以预留演示区。
5. 游戏分区的放映厅收录所有公开的 `games` 项目，其他分区以卡片形式收录作品。前端分区的博客入口在首页配置，点击后直接打开博客网站。

## 验收边界

- 保持旧详情页 URL、播放器、前后项目导航。
- 不允许分区和放映厅劫持正常页面纵向滚动；放映厅仅在原有效视口接收轮播滚轮。
- 空分区使用真实状态提示，不能伪造项目。
- Windows PowerShell 可执行 `pnpm.cmd check`、`pnpm.cmd build`、`pnpm.cmd verify:build`；线上部署不在本轮范围。
