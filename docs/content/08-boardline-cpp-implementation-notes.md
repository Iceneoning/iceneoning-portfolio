# BoardLine 当前 C++ 实现整理

日期：2026-10-11。用户明确授权查看 UE 文件夹，并进一步要求补充 BoardLine 当前技术细节。

工程根目录：`F:/Learnproject/BoardLineGame57`。只读检查 Source、相关 GameFeature 的 Source / Content 文件名及项目技术文档，没有修改 UE 工程，没有启动 UE、编译工程或重新执行 UE 自动化。本文为内部来源索引，不进入公开页面。

公开作品页：`src/content/projects/blitz-archive.mdx`。沿用开发中状态、封面上传约定和视频预留位置，补充 11 个技术章节、3 个流程图、模块职责表、充能公式和推车显示公式。

## 修正过时描述

- 旧页面只列 Shiroko。当前存在 `Roster_ShirokoHoshino.uasset`、Hoshino Hero / AbilitySet / Loadout / Presentation / UIData 资产，Phase2 文档说明已接入 Hoshino。其第三人称表现仍使用开发占位角色；公开文案只称英雄配置已接入，不称最终美术完成。
- 旧页面称检查点、回退、加时、换边、胜负与完整回合流程未实现。当前 TBPayload Simulation、MatchController、RulesTest 和 MapPIETest 已包含这些逻辑，页面据此改写为两轮攻守原型。
- August 总览和部分源代码注释仍写 slice 1；具体实现优先看当前 C++ 方法体。TBPayload README 的最新 ExpanseDepot 配置作为地图规则的辅助来源。
- 不把历史 Listen Server、Minimap 24/24、Payload 5 项等测试记录写成此次通过的结果；公开页只解释现有测试的设计与覆盖内容。

## 源码与公开描述对应

下表相对路径均基于上述 UE 工程根目录。

| 主题 | 来源 | 核对内容 |
| --- | --- | --- |
| 身份 / 事务 | `Source/LyraGame/Hero/BAHeroTypes.h` | Active HeroId + Revision、Pending、Transaction、Init / Change 状态、持久状态不包含切换事务 |
| 异步与恢复 | `Source/LyraGame/Hero/BAHeroSelectionComponent.cpp` | ResolveSerial 过期拒绝、Asset 校验、Presentation 预检、DestructiveCommit、重检上下文、故障注入、FailureRecovery |
| 装备精确清理 | `Source/LyraGame/Hero/BAHeroLoadoutComponent.cpp` | 栏位和物品预检、GrantRecord、仅移除匹配 ItemInstance、临时授予逆序回滚；旧装备恢复由上层事务负责 |
| 运行时资源 | `Source/LyraGame/Hero/BAHeroRuntimeContext.cpp` | Owned Actors / Loose Tag counts、先 MoveTemp 再 Destroy 防同步注销修改数组 |
| 表现资源 | `Source/LyraGame/Hero/BAHeroPresentationData.h` | 角色部件、相机与可选手臂软引用；AnimLayerClass 是预留字段，不声称已消费 |
| 附着 Provider | `Source/LyraGame/Equipment/LyraWeaponAttachmentComponent.cpp` | WeaponAttachmentSource -> Character Mesh -> Root，角色部件事件，隐藏骨骼 AlwaysTickPoseAndRefreshBones |
| 装备重附着 | `Source/LyraGame/Equipment/LyraEquipmentInstance.cpp` | 订阅 / 注销 Provider，RefreshSpawnedActorAttachments，AttachTransform × CharacterGripTransform |
| 大招充能 | `Source/LyraGame/AbilitySystem/LyraUltimateChargeComponent.cpp` | 来源 PlayerState 核对、TagQuery 首匹配倍率、0.25 秒被动充能、次数上限、Ready GE、移除回调延后查询 |
| 大招基类 | `Source/LyraGame/AbilitySystem/Abilities/LyraGameplayAbility_HeroUltimate.cpp` | ServerOnly、死亡状态阻止、一次性释放消费标记 |
| Shiroko 释放 | `Source/LyraGame/AbilitySystem/Abilities/LyraGameplayAbility_ShirokoDroneUltimate.cpp` | 位置探测、生成 / 初始化后扣费，扣费失败销毁 Actor；不把此顺序外推给所有大招 |
| Hoshino 护盾 | `Source/LyraGame/AbilitySystem/Abilities/LyraGameplayAbility_HoshinoBarrierUltimate.cpp` | SourceObject 来源、精确 ContributionHandle、Timer 到期与 EndAbility 回收 |
| 护盾账本 | `Source/LyraGame/AbilitySystem/LyraShieldLedgerComponent.cpp` | 剩余贡献顺序消费、精确 Handle / Source 撤销、总护盾对账 |
| 伤害接入 | `Source/LyraGame/AbilitySystem/Attributes/LyraHealthSet.cpp` | 已登记贡献先消费，未登记护盾兼容，最后生命值 |
| 英雄切换清护盾 | `Source/LyraGame/Hero/BAHeroSelectionComponent.cpp` | CleanupHeroOwnedState -> RemoveShieldContributionsBySource(RuntimeContext) |
| 无人机目标决策 | `Source/LyraGame/Skill/LyraShirokoUltimateDrone.cpp` | 0.01–0.1 秒扫描间隔、Pawn 球形候选、LOS 次数上限、250 / 120 / 500 权重、换目标间隔 / 领先阈值、近期可见缓存 |
| 发射解 / 导弹 | `Source/LyraGame/Skill/LyraShirokoUltimateDrone.cpp` 与 `LyraShirokoDroneMissile.cpp` | 预测直射 / 预计算弧线、Sweep、引信、服务器伤害、重复爆炸保护；无人机 / 导弹仍有 Movement Replication |
| 语义过渡分类 | `Source/LyraEditor/Utilities/MinimapBake/MinimapStableTransitionClassifier.h` / `.cpp` | 表面证据、单调性 / 反向度量、隔离、边界区域与自身连接拒绝 |
| Marker 注册 | `Source/LyraGame/Minimap/LyraMinimapMarkerProvider.h` 与 `LyraMinimapMarkerSubsystem.cpp` | 显式生命周期、Provider / Position Source / LocalPlayer 区分、归属 Handle、观察者过滤 |
| 敌情授权 | `Source/LyraGame/Awareness/LyraEnemyAwarenessSubsystem.h` / `.cpp` | 服务器 Grant、Hidden / Revealed / LastKnown、LastKnown 静态、OwnerOnly FastArray、NetQuantize10、Revision |
| Tactical Ping | ShooterCore 的 `LyraTacticalPingServiceComponent.cpp` | 服务器视点查找、存活敌方与 LOS / 夹角验证、Token Bucket、暂时禁用 |
| 战斗身份 | `Plugins/GameFeatures/CombatantRoster/Source/CombatantRosterRuntime/Public/CombatantTypes.h`、ControlTransferComponent、TravelRepository | 稳定 ID、PawnGeneration、离线策略、Travel 授权、期限、目标 World 消费；快照有弱 PlayerState 辅助绑定，不称完全无 UObject 引用 |
| 推车规则 | `Plugins/GameFeatures/TBPayload/Source/TBPayloadRuntime/Private/Payload/TBPayloadSimulation.cpp` | FTBPayloadSimulation::Step、部分帧宽限处理、下一检查点钳位、Locked / FurthestDistance、Overtime / CompareRounds |
| 推车人数 | 同目录 `TBPayloadObjectiveComponent.cpp` | 服务器遍历存活 Pawn，中心点距离判定；未声称空间索引或缓存 Overlap 优化 |
| 推车显示 | 同目录 `TBPayloadActor.cpp` | Movement Replication 关闭，复制状态、固定样条、碰撞组件移动、接收后最多 0.25 秒外推、阶段钳位与 RoundSerial 重置 |
| 回合 | 同目录 `TBPayloadMatchController.cpp` | Payload Tick prerequisite、准备 / 游戏 / 加时 / 中场 / 结算、换边、时间奖励、第二轮提前决胜、自动开下一局、取消能力先于 UnPossess |
| 已有测试设计 | `Plugins/GameFeatures/TBPayload/Source/TBPayloadRuntime/Private/Tests/TBPayloadRulesTest.cpp` / `TBPayloadMapPIETest.cpp` | 规则边界断言和两轮地图 / 网络 PIE 的 Latent 流程；本次未运行 |

## 辅助文档

- `Docs/武器系统重构/Lyra英雄系统Phase2-Hoshino实施与验收.md`：Hoshino 资产与技能配置；ShirokoHoshino roster；占位表现说明。
- `Docs/Minimap/更新版本/UE5.7_小地图_端到端数据流技术说明.md`：Recast -> 分类 -> Bake -> Runtime；输入 Hash、统一世界坐标投影。
- 武器附着 ADR：动画姿态源与最终可见 Mesh 的武器附着职责分离。
- `Plugins/GameFeatures/TBPayload/README.md`：ExpanseDepot 地图当前数值、地图 / Experience / RuleSet 资产名、原型范围。

## 网站验证

网站检查和截图记录单独验证 Astro 内容构建、站内章节、媒体占位及响应式布局，不代表 UE 运行时验收。保留原有回归脚本的来源 / 职责边界约束，没有为文案新增镜像测试。

- `pnpm check`：0 errors / 0 warnings / 0 hints。
- `pnpm build`：成功；第三方 Zod 的 PURE 注释产生既有 Rollup 警告，不影响构建。
- `node scripts/verify-build.mjs http://127.0.0.1:4330/`：281/281。
- 浏览器 1042 px 和 390 px 检查：文档宽度分别为 1027 px / 375 px，未出现页面横向溢出；手机流程图转为单列；章节跳转和视频 / 封面占位存在。
- 截图：`docs/implementation/qa-project-details/boardline-engineering-desktop.png` 与 `boardline-engineering-mobile.png`。
