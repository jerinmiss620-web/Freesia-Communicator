# Remote Loader Runtime v0.1.0

- 初始 Headless Remote Loader。
- 参考 TLE 已验证的 Bootstrap/Loader 分层、固定 Commit、SHA-256、UTF-8 长度验证、SRI 与 Blob 回退、IndexedDB LKG/Previous 缓存及失败回滚。
- 适配通讯侠 Core API：`__FREESIA_MESSENGER_V1__`、`version`、`open`、`close`、`destroy`、`hostWindow` 与根节点健康检查。
- 增加 Stable/Test Core Manifest 选择；默认 Stable，Test 通道由 Loader API 显式切换。
- 使用独立存储键和数据库，不覆盖通讯侠业务数据。
