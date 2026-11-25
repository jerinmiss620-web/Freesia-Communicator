# Freesia Messenger Remote Loader · v0.1.6

## 修复 IndexedDB 成为 Core 安装前置条件的问题

- Core Candidate 暂存改为 localStorage 完整源码记录，写入后读回并验证 SHA-256、UTF-8 字节长度、版本号。
- 删除失效的 IndexedDB Candidate 写入调用；v0.1.5 在安装流程中调用了已不存在的 `writeIndexedRecord`，会直接触发 ReferenceError。
- 新版本的 Candidate、Last Known Good、Previous 均使用 localStorage；IndexedDB 只保留旧版 LKG / Previous 指针的兼容读取路径。
- IndexedDB 连接丢失、重连失败或数据库不可用时，不再阻断首次 Core 安装、更新或回滚。
- 每次安装结束后清理临时候选缓存；正式 LKG / Previous 记录保留并继续执行读回校验。

## 兼容性与数据保护

- 沿用原有 Last Known Good、Previous、自动恢复授权、自动更新与通道设置键。
- 旧 IndexedDB 数据库不清理、不删除；可读取时才迁移旧记录，读取失败按缓存缺失处理并继续安全下载。
- 不修改通讯侠 Core 业务数据、聊天记录、动态、订阅、预设或 Prompt ID。
