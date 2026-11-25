# Freesia Messenger Permanent Bootstrap

通讯侠采用单入口更新链：酒馆助手只启用 Permanent Bootstrap；Bootstrap 管理 Remote Loader，Remote Loader 管理 Core。不要把 Loader 或 Core 再作为第二个独立启动脚本启用。

## 当前状态

- 当前 Stable Bootstrap / Loader 保持原有发布链。
- Bootstrap 1.0.6 + Remote Loader 0.1.8 正在 `test-bootstrap-toast-cleanup` 分支进行迁移提示与实机验收。
- TEST 导入包默认关闭，独立于 Stable 正式入口；未完成实机验收前不会替换 Stable。

## 本次测试更新

详见 [Bootstrap 1.0.6 更新说明](CHANGELOG-1.0.6.md)。

测试包：[Freesia Messenger Permanent Bootstrap 1.0.6 · TEST](../install/Freesia-Messenger-Permanent-Bootstrap-1.0.6-TEST.json)。

## 数据安全

更新不要求清除站点数据。Bootstrap / Loader 会校验缓存、保留上一份可恢复版本，并沿用通讯侠原有 Core API、业务存储键、聊天元数据和用户设置。
