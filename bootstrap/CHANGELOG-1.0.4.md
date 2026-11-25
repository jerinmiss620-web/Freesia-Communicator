# Freesia Messenger Permanent Bootstrap · v1.0.4

## 修复 IndexedDB 连接导致的启动与更新失败

- Bootstrap 的 Loader 缓存改为 localStorage 优先，写入后重新读回并验证 SHA-256 与 UTF-8 字节长度。
- 不再把 IndexedDB 连接成功视为缓存写入成功；新版本不再调用 IndexedDB 作为 Bootstrap 缓存的必经环节。
- 使用独立的 `freesia_messenger_bootstrap_cache_v2_` 缓存键；旧 IndexedDB 数据库与缓存不会删除或清理。
- 修正首次接管判断：即使旧设置显示自动恢复已授权，只要 Last Known Good 缺失，仍会启动安全接管。
- Bootstrap 更新缓存不再依赖 TT 或 iOS Safari 的 IndexedDB 连接状态。

## 迁移

1. 用 Bootstrap 1.0.4 替换 1.0.3 并启用。
2. 保留原通讯侠 Core 脚本备份，不清理站点数据。
3. Loader 0.1.5 启动后，若检测到现有 Core 没有可验证的 Last Known Good，会重新下载当前版本固定源码并提示安全接管。
4. 接管成功后按提示停用独立 Core，完整刷新酒馆。

本版本不删除 IndexedDB、localStorage 中的旧缓存，也不修改通讯业务数据键。
