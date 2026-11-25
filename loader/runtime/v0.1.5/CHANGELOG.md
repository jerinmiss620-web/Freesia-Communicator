# Freesia Messenger Remote Loader · v0.1.5

## 修复 IndexedDB 连接中断导致的更新失败

- Last Known Good 与 Previous Known Good 改为 localStorage 完整源码记录优先，写入后立即读回并验证 SHA-256、UTF-8 字节长度、版本号。
- 新版本保存回滚记录不再写入 IndexedDB；IndexedDB 仅作为旧版本指针缓存的兼容读取来源。
- 旧 IndexedDB 连接中断、重连失败或数据库不可用时，按缓存缺失处理并继续远程安全接管，不再因此拒绝 Loader 启动。
- 旧版 IndexedDB 记录只在成功读取并通过完整性验证后才尝试迁移到 localStorage；迁移失败不会清除原缓存。
- 缓存缺失时不允许无回滚保护地覆盖当前 Core；Bootstrap 会通过固定 Commit 下载当前运行版本并建立新的 Last Known Good。

## 存储边界

- 新缓存使用原有 Last Known Good / Previous Known Good localStorage 键，兼容原有设置与自动恢复授权。
- 旧 IndexedDB 数据库保留，不执行清库、不删除业务数据。
- 通讯消息、动态、订阅、预设与其他 Core 业务存储键不变。
