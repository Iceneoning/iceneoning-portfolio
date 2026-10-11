# UE 蓝图实现与作品集技术文案

2026-10-11。用户明确要求读取 UE 文件夹、按具体实现扩展技术细节。本记录仅用于维护，不发布到作品页。公开内容采用模块职责、状态和调用链、算法及实现取舍组织，不放置资料整理或验证状态栏目。

## 检查方法

- 工程：`F:/Learnproject/Challenge`、`F:/Learnproject/FPS`，主要玩法逻辑为 Blueprint。
- 使用 `tools/ue-inspect` 的只读控制台工具，依赖 [UAssetAPI 1.1.0](https://github.com/atenfyr/UAssetAPI)，读取 UE 5.7 资产并导出 JSON；没有调用资产写回 API，没有启动编辑器。
- 检查了 Challenge 的 15 个 Code 资产、FPS 的 31 个 Code 资产，以及 FPS 的两个 Reload Montage，共 48 个 `.uasset`。全部成功解析，RawExport 数为 0；这不等同于运行时行为验收。
- 读取 ClassExport 的变量和默认值、FunctionExport 的 Kismet 字节码，以及 StateTree 状态和实例参数。`summarize.mjs` 输出可读表达式辅助追踪；它不是完整反编译器，Jump 与控制流需结合原始 AST 理解，不能把输出当作原蓝图源码。
- 解析前后计算源文件 SHA-256。JSON、摘要及含本机路径的 manifest 位于工具的已忽略 `output/` 目录，不作为网站资产发布。源工程不修改。

## Challenge 的内容依据

| 资产 | 读取到的实现 | 对应技术说明 |
| --- | --- | --- |
| `BP_challengecharactor` | BeginPlay 注册 IMC；相机只保留 Yaw；输入 X 前向、Y 侧向；Dead 开启物理、停运动、延迟 2 秒后销毁并调用 Birth；Z ≤ 452 调 Dead | 输入向量转换、角色生命周期、固定高度的取舍 |
| `ABp_ChallengeCharactor` | 水平 VSize、ZSpeed、IsFalling；状态过渡读取运动状态和动画剩余时间 | 动画消费实际速度而非单纯按键状态 |
| `BP_challengeMode` | Transform 类型 RebirthLocation；出生单位 Scale；Spawn 新 Pawn 后 Controller 0 Possess | 进度跨 Pawn 保存、重生控制权接管 |
| `BP_Rebirth` | Box overlap cast 玩家；自己的 Transform 去除 Scale 后写入 GameMode；Color 材质参数改暖黄色 | 空间触发过滤、缩放隔离与激活反馈 |
| `BP_002` | BeginPlay 保存两组件 RelativeLocation；Z1 初值+t，Z2 初值+abs(t−150) | 使用基准加曲线偏移防止累积漂移 |
| `BP_003` | Tick 增加 5° Yaw；Death 决定死亡/Arrow Forward×20000 AddImpulse；ConstructionScript 控制尖刺可见性 | 实例模式、方向配置；每帧旋转的帧率依赖 |
| `BP_004` | Timeline roll×360，Move1×440；保留 Y/Z/Scale 写回 Transform | 位移与旋转合成 |
| `BP_Sphere` | Timeline 写 Pitch；Finished→loop→PlayFromStart；球体 overlap 调 Dead | 摆动循环与危险碰撞分离 |
| `BP_launch` | 可编辑 Launch Velocity Z=2400；LaunchCharacter 两个 Override 均 false | 叠加发射速度 |
| `BP_win` | 遍历实例 Niagara Actor 数组 Activate(true) | 关卡配置庆祝对象 |

删除原文“同类机关都可暴露速度/方向”的泛化描述。现在只写已存在的编辑配置点；Timeline 常量留在蓝图内部。

## FPS 的内容依据

| 资产 | 读取到的实现 | 对应技术说明 |
| --- | --- | --- |
| `BP_FPSPlayer` | 状态优先 Aim；MoveX>0且Run意图为Run；速度400/400/600/265；缓存DefaultFOV；ADS目标75、InterpSpeed8；OutFOV循环恢复并在误差0.1清Timer | 状态优先级、速度和视角分别处理 |
| `BP_FPSPlayer.SpawnWeapon` | Spawn owner=self；缓存 CurrentWeapon；AttachToComponent(Arm) | 武器与玩家的拥有关系 |
| `BP_Weaponbase` | Idle 门控；立即 Fire Internal，再建立循环 Timer；清理 Handle 停火；按角色状态选择双 Montage | 连射生命周期与双状态维度 |
| `BP_VIRTUS` | Ammo30、Reserve180、Magsize30、Damage25、FireRate0.1 | 具体武器配置 |
| `BP_Weaponbase` | 相机射线长度10000；Pitch−0.4、随机Yaw±0.1；Casing Socket生成弹壳；MetaSound与Muzzle Niagara | Hitscan判定与枪口表现 |
| `BP_Weaponbase.Reload_Ammo` | 缺口=Magsize−CurrentAmmo；备弹够则补满并扣缺口，否则备弹全转入弹匣 | 守恒结算；页面min表达式明确标为等价伪代码 |
| `AN_Reload`、枪械 Reload Montage | AN读取Mesh Owner，调用 Reload_Ammo 后 UpdateWeaponInfo；枪械 Montage 实际包含 AN_Reload 通知 | 动画通知是提交入口，不由输入立刻补弹 |
| `BP_Weaponbase` | 表面0/5 Concrete、1 Dirt、2 Metal、3 Wood、4 Enemy；Normal→MakeRotFromX；Enemy ApplyDamage | 反馈分发表与伤害入口 |
| `ABP_FPSPlayer` | TryGetPawnOwner读 MoveX/MoveY/State/Movement；取武器AimSocket；剩余动画时间参与过渡 | Gameplay→手臂动画状态 |
| `ABP_VIRTUSFPSWeapon` | Initialize沿武器Owner找玩家，Arm.GetAnimInstance cast/cache；读取手臂AnimBP Move/State/Movement | 实际数据依赖，不能夸大为已显式设置TickPrerequisite |
| `ST_Zombie`、`STE_GetPlayer` | Root下Chase/Attack，OnStateCompleted互转；TreeStart缓存玩家，数据绑定PlayActor→TargetActor | Evaluator、Task及状态转换 |
| `STT_ZombieAttack` | Enter重置Time/HasHit；Tick累加时间；命中范围内ApplyDamage后HasHit；到AttackDuration FinishTask | 伤害时窗与成功命中仅一次 |
| StateTree攻击实例 | HitTime0.35、Duration0.78、Range170、Damage20 | 参数来自ST实例，不是Task CDO缺省值 |
| `BP_FPSPlayer` | 受伤清恢复Timer；RetriggerableDelay5；每0.1秒恢复1.5、Clamp；死亡禁输入/UI模式/镜头Timeline | 受伤推迟恢复、死亡UI循环 |
| `BP_Zombie` | DoOnce式门控；UnPossess、Capsule无碰撞、Ragdoll、SimulatePhysics、Delay5销毁 | AI停止、物理表现与Actor清理 |

删除原文将僵尸行为称为后续扩展的表述。保留历史一帧错位问题及作者的修复结果，同时明确当前代码只能说明数据依赖，不能凭静态引用断言全局同帧求值保证。

## 页面与检查

- 两个 MDX 页面引入 `EngineeringFlow.astro`，桌面显示步骤卡片，窄屏显示纵向步骤；没有新增客户端脚本。
- 保留原有媒体封面、截图、视频槽与职责说明；BoardLine/RTS 内容不扩写。
- 使用 Astro check/build、现有静态输出回归检查和浏览器桌面/390px视口确认页面。
