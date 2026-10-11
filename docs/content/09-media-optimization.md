# 演示视频与 BoardLine 封面优化

2026-10-11。用户提供三部作品的视频与 BoardLine 封面，要求发布单文件不超过 25 MiB。使用本机已有 FFmpeg 9.0.1 与项目已有 Sharp，不上传原素材到外部服务。

## 发布结果

| 素材 | 原文件字节数 | 发布字节数 | 发布大小 | 尺寸 / 时长 |
| --- | ---: | ---: | ---: | --- |
| Challenge | 208,083,107 | 25,143,635 | 23.979 MiB | 1152 × 720 / 167.485850 秒 |
| FPS | 127,842,173 | 25,157,392 | 23.992 MiB | 1152 × 720 / 103.955941 秒 |
| BoardLine | 87,188,414 | 25,237,492 | 24.068 MiB | 1152 × 720 / 69.915011 秒 |
| BoardLine 主视觉 | 2,346,796 | 235,026 | 229.52 KiB | 1600 × 900 |

25 MiB = 26,214,400 字节。所有发布文件均低于这个上限；最大视频剩余约 0.93 MiB 余量。压缩有损，原素材完整保存。

视频输出到 `public/media/projects/{challenge,fps,blitz-archive}/demo.mp4`，封面输出到 `public/media/projects/blitz-archive/cover.webp`。原视频和 PNG 保存到本地 `media-source/` 的相应项目子目录，目录被 Git 忽略，不进入 Astro 发布产物。每个原文件移动前后都核对 SHA-256，详细数据在本地 `media-source/optimization-report.json`。

## 编码参数与画面检查

- 视频保持完整时长、原有 30fps 和音轨，不剪辑、不裁剪，原画面 1728 × 1080 按比例缩至 1152 × 720。
- H.264 / AAC MP4，x264 medium、双遍平均码率、yuv420p、High profile、60 帧关键帧间隔。
- 以 24 MiB 为目标预算，按时长扣除 AAC 96 kbps 与容器余量；Challenge / FPS / BoardLine 视频码率分别 1094 / 1828 / 2771 kbps。
- `+faststart` 把 moov 放在 mdat 之前；三份发布 MP4 的顶层顺序均为 ftyp、moov、free、mdat。
- PNG 转 WebP，宽度最多 1600，quality 84、effort 6，去除非必要元数据。公开 Alt / Caption 描述为「项目主视觉」，不声称其为实机截图。
- 三个视频均完成全长解码，decode 日志为 0 字节；尺寸、编码、完整时长、音轨和大小通过脚本核对。
- 抽帧比较原文件与发布文件：Challenge 65 秒、FPS 35 秒、BoardLine 40 秒；主体、界面与反馈保持可辨，Challenge 的动态水面和纹理细节有压缩损失。比较图只保存在本地工作目录。

## 网页接入与构建

三个项目使用已有原生播放器：controls、playsinline、preload=none、无自动播放；BoardLine 主视觉同时作为首页封面、详情页封面与视频 poster。未提供视频的 RTS 继续使用占位。

`src/lib/project-media.ts` 改为 Astro 服务端构建时检查 public 文件是否存在。原 Vite URL glob 会额外输出 `_astro/demo.*.mp4`，使三个视频重复进入发布产物；已取消该导入方式，最终只发布三份 MP4。为服务端文件访问加入 `@types/node` 22 开发依赖，实际版本锁定于 pnpm-lock。

BoardLine 演示重点按这份视频的实际内容调整为：Shiroko 角色与武器表现、持枪移动与射击、命中与死亡反馈、编辑器内玩法演示。项目技术正文仍介绍工程整体实现。

`scripts/optimize-media.mjs` 留存处理流程，已存在的发布文件和原文件备份不会被覆盖。`scripts/verify-build.mjs` 对整个 dist 添加单文件大小检查，超过 25 MiB 直接失败。

浏览器播放检查与 Range 请求检查针对本地构建预览 `http://127.0.0.1:4330/`。三份 MP4 的 Range 请求均返回 HTTP 206、video/mp4 与正确 Content-Range。

页面截图保存在 `docs/implementation/qa-project-details/boardline-video-desktop.png`、`boardline-media-cover.png` 和 `boardline-video-mobile.png`。

最终验收：`pnpm check` 0 errors / 0 warnings / 0 hints；`pnpm build` 成功；包含文件大小检查的站点回归 323/323。dist 中只有三份 MP4，最大文件为 25,237,492 字节；media-source 中的原文件未进入发布产物。三部视频在 Chromium 页面播放器中实际播放，readyState=4、error=null、1152 × 720，完整时长与 ffprobe 一致。1042 px 桌面和 390 px 手机视口均无文档横向溢出；手机播放器宽度约 335 px。播放器检查后暂停并恢复浏览器默认视口。
