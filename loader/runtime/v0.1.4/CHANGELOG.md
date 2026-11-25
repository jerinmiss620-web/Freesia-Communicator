# Freesia Messenger Remote Loader · v0.1.4

## 修复首次接管与更新阻塞

- 统一使用 TLE 已验证的直接父窗口宿主定位，确保 Bootstrap、Loader 与 Core 将运行实例挂载到同一宿主 Window。
- 修正当前 Core 的健康检测：通讯侠 Core API 不暴露 `state.destroyed`，改用 Loader 实际使用的版本、destroy/open/close、hostWindow 与根节点检查。
- 修复 `adoptCurrent()`：不再要求当前运行版本必须等于远程最新版本。可以从 Test 清单中的固定历史发布记录下载当前运行版本，校验 SHA-256 与 UTF-8 字节长度后建立 Last Known Good。
- 只有当前版本被历史接管清单明确列出且源码验证成功，才允许保存自动恢复授权；不匹配时保留原运行实例。
- 修正更新失败时“上一实例仍在运行”的检测，不再依赖通讯侠 Core 实际不存在的 `state.destroyed` 字段。
- 修正自动恢复阶段对现有 Core 的检测，避免把健康运行的独立 Core 当作空实例。

## 安全边界

- 不会自动覆盖没有回滚副本的独立 Core。
- 接管前只下载并校验当前运行版本的固定 Commit 源码，不替换当前实例。
- 用户确认接管后才保存 Last Known Good 和自动恢复授权。
- 自动更新仍要求当前运行版本与回滚副本一致。
