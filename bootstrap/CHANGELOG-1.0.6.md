# Freesia Messenger Permanent Bootstrap 1.0.6 · TEST 更新说明

## 本次更新

- 将永久 Bootstrap 与 Remote Loader 的启动、缓存和更新流程整合为单一入口；用户只需启用 Bootstrap，不需要另外启用 Loader。
- Loader 升级至 0.1.8，采用 IndexedDB Candidate / Last Known Good / Previous 缓存，并在写入后读回校验。
- 保留旧 Bootstrap / Loader 的缓存迁移路径及原有通讯侠 Core API、聊天数据、设置和业务存储键。
- 修正 Stable Core 清单滞后：`main/latest.json` 现与正式 Core v0.3.37 对齐，最低 Loader 版本仍兼容 v0.1.6。
- 旧缓存 Loader 在迁移期间产生的“自动恢复成功”“当前版本已是最新”和中间线路切换提示改为内部诊断，不再逐条打扰用户。
- 新 Loader 的最终 Core 更新成功提示保留一次；最终网络失败、完整性校验失败、缓存损坏及回滚失败仍明确提示。

## 单入口迁移说明

首次迁移时，Bootstrap 可能从自己的本地缓存恢复旧 Loader v0.1.6，再将它替换为 v0.1.8。这是同一个 Bootstrap 脚本内部的缓存恢复与升级顺序，不代表用户同时启用了多个通讯侠脚本。

旧 Loader 只作为回滚来源保留在 Bootstrap 缓存中；不需要单独导入或启用第二个 Loader。若酒馆助手中确实另有独立 Loader 或 Core 脚本处于启用状态，才需要停用那份独立入口。

## 数据与回滚

- 不清除酒馆站点数据、IndexedDB、localStorage 或聊天数据。
- 保留现有 Core API、业务存储键、聊天元数据与用户设置。
- 新版本必须通过源码长度、SHA-256 和启动健康检查后才会成为 Last Known Good。
- 新版本启动失败时保留并尝试恢复上一份已验证缓存。

## 验证状态

- 自动化回放覆盖单 Bootstrap 从缓存 Loader v0.1.6 迁移至 Loader v0.1.8，并验证旧启动提示被抑制、最终更新成功提示只出现一次。
- 当前测试分支已通过 GitHub Actions：JavaScript 语法、完整更新链回放、Core 发布完整性，以及 Bootstrap / Loader / Core 清单一致性检查全部通过。回放专门验证单一 Bootstrap 将缓存 Loader v0.1.6 迁移到 v0.1.8 时，不再泄漏旧提示，并且最终 Core 更新成功提示恰好出现一次。
- 本文件对应 TEST 通道；提示收敛后的 iPhone、TT 与 ST 实机复测仍待完成。通过实机验收前不替换 Stable Bootstrap 入口。
