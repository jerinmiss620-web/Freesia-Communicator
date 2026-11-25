# Freesia Messenger Core v0.3.22

- 将原始通讯侠 v0.3.22 JSON 主体归档为远程 Core 源码。
- 修正内部运行 API 版本标识：由残留的 v0.3.21 统一为 v0.3.22，使 Loader 健康检查与发布版本一致。
- 除版本标识外，不重构通讯业务逻辑，不重命名原有 localStorage 键、聊天元数据键、Prompt ID 或数据结构。
- 作为首次 Remote Loader 迁移基线；移动端入口、821px 全屏、控制中心开关等后续整改应发布为新的 Core 版本，并先走 Test 通道。
