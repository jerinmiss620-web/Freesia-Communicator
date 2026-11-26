# Freesia Messenger Permanent Bootstrap

通讯侠采用单入口更新链：酒馆助手只启用 Permanent Bootstrap；Bootstrap 管理 Remote Loader，Remote Loader 管理 Core。不要把 Loader 或 Core 再作为第二个独立启动脚本启用。

## 当前正式版本

- **Stable Bootstrap：** 1.0.8
- **Stable Remote Loader：** 0.1.9
- **Stable Core：** 0.3.38
- **正式安装包：** [Freesia Messenger Permanent Bootstrap 1.0.8](../install/Freesia-Messenger-Permanent-Bootstrap-1.0.8.json)

## 更新链

1. Bootstrap 1.0.8 从 `main/loader/latest.json` 检查远程 Loader。
2. Loader 0.1.9 默认读取 `main/latest.json`；用户明确选择 Test 通道时读取 `main/channels/test.json`。
3. Loader 校验 Core 源码的 SHA-256 与 UTF-8 字节长度，再按 Last Known Good / Previous 机制更新与回滚。

## 本次正式发布

详见 [Bootstrap 1.0.8 更新说明](CHANGELOG-1.0.8.md)。

- 远程 Loader 优先，缓存仅作为已验证的离线回退。
- 旧 Loader 忙碌时等待其完成当前操作，不强行中断。
- 合并迁移期间旧版本提示，避免旧清单误报。
- 防止远程 Loader 低于已验证本地缓存时发生降级。
- 保留原 Stable Bootstrap 脚本 ID、Core API、聊天数据和用户设置。

## 安装与迁移

- 导入正式安装包并启用。
- 只保留一份 Permanent Bootstrap 作为入口；不需要另外启用 Loader。
- 若之前使用独立旧 Loader / Core 入口，按迁移提示停用旧入口，避免并行启动。
- 不要为更新通讯侠清除站点数据、IndexedDB、localStorage 或聊天记录。

## 测试分支

测试包仍保留在 `test-bootstrap-toast-cleanup` 分支，不会被 Stable 安装包引用。Stable Loader 的正式地址固定指向 `main`。

## 验证

- Bootstrap 1.0.8 已在 TT 实机完成更新链验收，加载成功且速度正常。
- 发布工作流检查 Bootstrap / Loader / Core 版本、入口地址、SHA-256、字节长度、脚本 ID 与 JavaScript 语法。
- 其它 Android 设备、ST 与 iPhone Safari 仍建议按实际环境回归。
