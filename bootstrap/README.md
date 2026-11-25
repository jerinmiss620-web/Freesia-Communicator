# Permanent Bootstrap v1.0.1

[导入包](Freesia-Communicator-Permanent-Bootstrap-1.0.1.json) 是唯一需要手动导入的启动脚本。它从 `loader/latest.json` 加载远程 Loader Runtime；Loader 再从 Stable/Test Core Manifest 加载通讯侠主体。

## 首次迁移

1. 停用旧完整通讯侠脚本，保留原 JSON 备份。
2. 导入本目录的 JSON 包。
3. 启用 Bootstrap 并刷新酒馆宿主页面。
4. 首次启动需要联网；成功后通讯侠 Core 会自动恢复运行。

## 日常更新

Bootstrap 与 Loader 会定期检查更新。普通 Core 更新只修改 GitHub 上的 Core 与 Manifest；用户无需重新导入 Bootstrap 或下载新 JSON。Loader Runtime 更新也由现有 Bootstrap 自动获取，不需要重新导入。

Bootstrap 自身是固定启动协议。只有未来启动协议不兼容时才可能需要重新导入新的 Bootstrap。

## 故障恢复

如果新版本无法启动，Loader 会尝试从 IndexedDB 的 Last Known Good / Previous 缓存恢复。若 Bootstrap 本身未被酒馆助手执行，远程加载链无法启动；此时可停用 Bootstrap 并重新启用保留的旧版完整通讯侠 JSON。
