# Freesia Messenger Permanent Bootstrap · v1.0.5

## 修复旧 Loader 迁移死锁与启动回退判断

- 对 Loader v0.1.2–v0.1.5 内置固定 Commit、SHA-256 与 UTF-8 字节长度；新 Bootstrap 检测到旧版 Loader 且没有本地回滚副本时，先下载并验证旧版源码，再写入 Previous 缓存。
- 保留现有 localStorage 缓存命名空间与数据，不清除旧 IndexedDB。
- 修复 evaluate() 对 Loader.ready 的重复 await。若远程脚本已注册运行时但 ready 失败，明确报告启动失败并进入安全回滚，不再重复等待同一个已拒绝 Promise。
- 只有远程 script 注入未注册运行时 API 时才尝试 Blob 回退；已注册但启动失败的运行时不会被重复注入。
- 保留原 Tavern Helper Bootstrap 脚本 ID，导入新版时可替换同一脚本身份。

## 迁移步骤

1. 在酒馆助手中停用旧 Bootstrap 1.0.3/1.0.4。
2. 导入 Bootstrap 1.0.5 JSON 并启用。
3. Bootstrap 为旧 Loader 建立固定源码回滚副本后，更新到 Loader 0.1.6。
4. Loader 0.1.6 将 Core Candidate 暂存改为 localStorage，不再要求 IndexedDB 可用。
5. 保留原 Core 救援副本；不要清除 localStorage、IndexedDB 或聊天数据。
