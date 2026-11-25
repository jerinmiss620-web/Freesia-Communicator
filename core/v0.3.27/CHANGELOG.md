# Freesia Messenger · v0.3.27

## Loader 更新管理接入通讯侠扩展栏

- 在现有「通讯侠 · Freesia Messenger」扩展折叠栏内加入远程更新管理，不额外创建悬浮球、独立弹窗或第二套入口。
- 显示 Permanent Bootstrap、Remote Loader、当前 Core、远程候选版本及最近一次更新状态。
- 提供 Stable 正式版 / Test 测试版通道切换；切换前由 Loader 原生确认流程处理潜在降级。
- 提供手动检查更新、安装更新、恢复上一版本三个操作，继续复用 Loader 的 SHA-256 校验、Last Known Good 备份、健康检查及自动回滚。
- 提供自动更新开关；关闭自动更新后仍可手动检查和安装。
- Loader 与 Bootstrap 状态事件实时同步到扩展栏；Loader 未启动时明确显示连接状态及启动器要求。
- 保留原有扩展控制、主动联络、通讯备份、聊天记录、动态、订阅、预设及全部存储键。

## 保持不变

- 不修改 Stable 正式版清单。
- 不修改 Permanent Bootstrap 1.0.2 与 Remote Loader 0.1.3 的运行代码。
- 不增加独立 Loader 悬浮入口，不改变通讯侠现有悬浮球和窗口控制。
- 不更改通讯数据结构、聊天元数据或用户设置存储键。

本版本仅发布到 Test 测试通道，实际 ST / TT 运行及通道切换、安装、回滚仍需设备验证。
