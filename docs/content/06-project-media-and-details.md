# 作品技术细节与媒体接入

2026-10-11。Challenge、FPS 技术案例依据用户博客原文及 UE 工程蓝图实现补充；进一步直接解析编译字节码、默认属性、动画通知与 StateTree 实例配置，详见 `07-ue-blueprint-implementation-notes.md`。最初保留 RTS 与 BoardLine 主体内容；随后用户明确要求补充 BoardLine 当前技术细节，已依据 C++ 源码重写，详见 `08-boardline-cpp-implementation-notes.md`。RTS 保留「敬请期待」内容；按用户反馈移除公开页面中面向内容整理流程的备注。

公开页面面向面试官：不展示媒体来自博客、资料状态、待补清单、授权待核对或本轮操作记录。来源记录仅保留在本文件中。环境美术使用网上获取的资源，个人工作集中在玩法蓝图、系统接入与关卡组织。项目实际开发范围和技术取舍继续如实呈现。

## 本轮使用的博客资料

- `H:/vs_code/fuwari/src/content/posts/加勒比海盗的那些事.md`：参数化机关、布娃娃死亡、检查点、关卡布局与终点庆祝。
- `H:/vs_code/fuwari/src/content/posts/FPS僵尸，但是腿呢，可惜没有动画遮罩.md`：实例逆向、射击反馈、换弹流程、手臂／武器 AnimBP 的一帧时序错位排查。
- 本轮以只读离线方式检查 UE 资产，未启动 UE 做运行时测试；函数调用、算法及具体配置来自实际资产。历史动画错位及调整结果来自作者记录，当前工程中的 AnimInstance 引用和状态读取已核对，不声称变量引用本身能够保证 Tick／线程求值顺序。

用户授权从博客复用封面。已查看两张封面内容，复制为作品集本地文件；博客文件未修改。Challenge 的额外关卡图片同样来自原文章，用于支持机关和流程描述。

| 作品集文件 | 博客图片目录及文件 |
| --- | --- |
| `public/media/projects/challenge/cover.webp` | `加勒比海盗的那些事/2.webp` |
| `public/media/projects/challenge/swing.webp` | `加勒比海盗的那些事/1.webp` |
| `public/media/projects/challenge/log.webp` | `加勒比海盗的那些事/3.webp` |
| `public/media/projects/challenge/route.webp` | `加勒比海盗的那些事/4.webp` |
| `public/media/projects/challenge/finish.webp` | `加勒比海盗的那些事/5.webp` |
| `public/media/projects/fps/cover.webp` | `FPS僵尸，但是腿呢，可惜没有动画遮罩/0.webp` |

## BoardLine 封面

把图片放到以下任一路径，重新构建后，首页卡片和项目页同时使用该图，无需修改 MDX：

- `public/media/projects/blitz-archive/cover.webp`（优先）
- `public/media/projects/blitz-archive/cover.png`
- `public/media/projects/blitz-archive/cover.jpg`

未上传时显示「项目封面待上传」，不请求不存在的图片。约定目录中的文件被视为准备公开的媒体。用户随后提供「未来学院护送战线.png」，已压缩为 `cover.webp` 并接入，描述使用「项目主视觉」。

## 视频演示

每个项目页的首屏信息之后有独立 16:9 视频区，章节导航可直接跳转。未提供文件时展示预留画面，不生成空播放器或播放按钮。

| 项目 | 上传路径 |
| --- | --- |
| Challenge | `public/media/projects/challenge/demo.webm` 或 `demo.mp4` |
| FPS | `public/media/projects/fps/demo.webm` 或 `demo.mp4` |
| RTS | `public/media/projects/rts-gameplay-systems/demo.webm` 或 `demo.mp4` |
| BoardLine | `public/media/projects/blitz-archive/demo.webm` 或 `demo.mp4` |

构建时自动检查已存在文件。WebM 优先，MP4 可作备用；使用原生 `controls`、`playsinline`、`preload="none"` 与项目封面 poster，无自动播放。上传后执行 `pnpm build`；开发模式新增媒体后刷新页面。用户随后在 `public/Video/` 提供三部作品视频，已压缩为各项目的 `demo.mp4`，原文件移至本地 `media-source/` 保存，详见 `09-media-optimization.md`。

`src/lib/project-media.ts` 管理文件约定；MDX 的 `demoHighlights` 管理演示重点，`gallery` 管理截图与说明，`evidenceNote` 管理该项目资料来源与验证范围。
