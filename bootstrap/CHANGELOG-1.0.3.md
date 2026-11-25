# Freesia Messenger Permanent Bootstrap · v1.0.3

## 修复内容

- 宿主窗口定位改为与 TLE Permanent Bootstrap v1.0.6 一致的 `SCRIPT_WIN.parent` 契约，不再遍历祖先窗口并猜测宿主。
- Core 健康检查改为与通讯侠 Core API / Remote Loader 的实际健康条件一致：检查版本、destroy/open/close 接口、hostWindow 与通讯侠根节点。
- 移除对 `core.remoteLoaderManaged === true` 的启动成功前置要求。已有独立运行的通讯侠 Core 不再被 Bootstrap 误判为“Core 未启动”。
- 启动后检测当前 Core 是否尚未建立回滚授权；若需要接管，调用 Loader 的 `adoptCurrent()` 安全流程，校验当前版本源码并建立 Last Known Good，再由用户确认。
- 保留现有 IndexedDB 缓存、Loader 更新链、失败诊断弹窗、重试与回滚机制。

## 迁移

1. 停用 Bootstrap 1.0.2。
2. 导入并启用 Bootstrap 1.0.3。
3. 若提示接管当前 Core，确认后停用原单独导入的通讯侠 Core 脚本。
4. 完整刷新酒馆。后续由 Bootstrap → Remote Loader → Core 管理更新。

本版本不清理旧缓存、不删除通讯数据，也不修改 Stable Core 清单。
