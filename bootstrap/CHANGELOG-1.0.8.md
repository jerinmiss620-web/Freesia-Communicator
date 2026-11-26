# Freesia Messenger Permanent Bootstrap v1.0.8 · Stable

## 正式发布

- 将已在 TT 实机验证的 Bootstrap 1.0.8 迁移修复纳入 Stable 更新链。
- 正式 Bootstrap 读取 `main/loader/latest.json`，不再强制写入 TEST 通道；保留用户已有 Stable / Test 通道偏好，新安装默认 Stable。
- 正式更新链：Bootstrap 1.0.8 → Remote Loader 0.1.9 → Core 0.3.38。

## 迁移与更新修复

- 启动时先读取并校验回滚缓存，但优先检查并启动远程 Loader；只有远程不可用且没有运行时，才使用已验证缓存离线恢复。
- 迁移旧 Loader 前等待当前操作结束，最长 45 秒；超时会保留原版本并明确提示，不强制中断。
- 迁移期间收敛旧 Loader 的过期版本提示，避免旧清单的 v0.3.29 降级提示误导用户。
- 如果远程 Loader 版本低于已验证缓存，则拒绝降级并保留较新缓存。
- 保留原 Stable Bootstrap 脚本 ID、Loader/Core API、聊天数据、用户设置和业务存储键。

## 安装说明

- 导入 [Permanent Bootstrap 1.0.8](../install/Freesia-Messenger-Permanent-Bootstrap-1.0.8.json) 并启用。
- 只保留一份 Permanent Bootstrap 作为入口；不需要另外启用 Loader。
- 不要为了更新通讯侠而清除酒馆站点数据。

## 已知验收边界

- Bootstrap 1.0.8 的 TT 实机更新链已通过：成功启动，实际运行 Core v0.3.38，加载速度正常。
- 其它 Android 设备、ST 与 iPhone Safari 仍建议按实际环境回归；GitHub 静态检查不能替代每种设备的实机测试。
