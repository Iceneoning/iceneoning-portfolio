# Challenge / FPS 代表作品素材采集清单

> 2026-10-11，基于工作区文件与配置的只读核查。蓝图资产均为 `.uasset`，本轮未逐图检查节点或通过实机验证全部逻辑。素材须由用户在 UE 中核对、录制并批准公开。

## Challenge（`F:\Learnproject\Challenge`）

- [ ] 一张 16:9 关卡全景，展示角色与主要挑战区域（封面候选）
- [ ] 30–60 秒流程片段：角色移动/跳跃、机关操作、失败与重生、终点（只录制真实可运行的部分）
- [ ] `BP_challengecharactor` 与 `IMC_Chanllge2` 关键节点截图
- [ ] `ABp_ChallengeCharactor` / `BS1D_Challenge` 动画状态截图
- [ ] `BP_launch`、`BP_Rebirth`、`BP_win` 的核心逻辑，核对后再命名技术亮点
- [ ] 确认 `BP_002`、`BP_003`、`BP_004`、`BP_Sphere` 的实际玩法名称与触发/重置流程

## FPS（`F:\Learnproject\FPS`）

- [ ] 一张 16:9 第一人称持枪实机图（封面候选）
- [ ] 30–60 秒流程片段：移动、瞄准、射击、换弹、弹孔反馈、僵尸交互（仅展示已运行的功能）
- [ ] `BP_Weaponbase`、`BP_VIRTUS`、`BI_Fire` 之间的蓝图调用关系截图
- [ ] `AN_Reload` 与动画蓝图的实际调用位置截图
- [ ] 物理材质与贴花的命中差异录屏或对比截图
- [ ] `ST_Zombie`、`STE_GetPlayer`、`STT_ZombieAttack` 实际 StateTree 图表截图，确认敌人感知与切换条件

## 通用核对

- 视频保留原始录制；作品集使用压缩后的 WebM/MP4 与 WebP 封面，公开前检查声音、素材授权和个人隐私。
- 确认究竟由本人制作的是玩法蓝图、数据配置还是美术资源，不把 Marketplace/项目已有资源记为原创。
- 已有资产不能代替功能验收；若某一机制无法在实机复现，正文应修改为「已配置／待验证」。
- 网站当前 `mediaApproved: false`；获得可公开的真实封面并设置 `cover` 与 `coverAlt` 后再改为 `true`。
