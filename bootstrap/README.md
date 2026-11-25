# Permanent Bootstrap v1.0.2

[导入包](Freesia-Communicator-Permanent-Bootstrap-1.0.2.json) 是唯一需要手动导入的启动脚本。它从 `loader/latest.json` 加载远程 Loader Runtime；Loader 再从 Stable/Test Core Manifest 加载通讯侠主体。

## 本次升级

Bootstrap 1.0.2 与 Core v0.3.24 使用相同的逐层宿主定位算法，并能在旧 DOM 或 Shadow DOM 内识别通讯侠根节点。它还会核对 Loader 管理状态与实际 Core 版本，避免把仍在运行的旧独立脚本误判为新版本启动成功。

**如果目前使用 Bootstrap 1.0.1，需要重新导入一次 1.0.2。** 这是本次宿主定位协议变更所必需的；后续普通 Loader/Core 更新仍不需要重新导入。

## 首次迁移

1. 停用旧 Bootstrap 1.0.1。
2. 导入本目录的 JSON 包并启用。
3. 刷新酒馆宿主页面。
4. Bootstrap 会沿用原有缓存并安装 Loader Runtime 0.1.3，再由 Loader 检查 Core。
5. 确认实际运行版本后再处理旧的独立脚本副本。

## 数据保留

本次沿用既有 Bootstrap IndexedDB 数据库名称与 store、Loader IndexedDB 数据库名称与缓存槽位、localStorage 键及通讯侠业务存储键。不要清除站点数据、IndexedDB 或聊天数据。

## 日常更新

Bootstrap 与 Loader 会定期检查更新。普通 Core 更新只修改 GitHub 上的 Core 与 Manifest；用户无需重新导入 Bootstrap 或下载新 JSON。Loader Runtime 更新也由现有 Bootstrap 自动获取，不需要重新导入。

Bootstrap 自身是固定启动协议。只有未来启动协议再次变化时才可能需要重新导入新的 Bootstrap。

## 故障恢复

如果新版本无法启动，Loader 会尝试从 IndexedDB 的 Last Known Good / Previous 缓存恢复。若 Bootstrap 本身未被酒馆助手执行，远程加载链无法启动；此时可停用 Bootstrap 并重新启用保留的旧版完整通讯侠 JSON。
