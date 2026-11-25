# Freesia Messenger · 通讯侠 v0.3.30

## 改为 GitHub 本体直连

- 新增酒馆助手脚本导入包：脚本本身只负责动态 import GitHub 上的通讯侠本体。
- 新增稳定入口 `core/current/Freesia-Messenger.js`；版本快照保存在 `core/v0.3.30/Freesia-Messenger.js`。
- 导入 URL 使用时间戳查询参数，重新执行脚本时会请求当前 GitHub 源码，不再依赖远程 Loader 的缓存、候选版本和 IndexedDB。
- 动态导入完成后检查通讯侠实例是否已在酒馆宿主窗口注册；失败时输出控制台错误并尝试显示 toastr 通知。
- 从通讯侠扩展控制中心移除失效的 Bootstrap / Loader 更新管理区；保留快捷设置、主动联络、通讯状态、备份与诊断。
- 保留原脚本 ID `6ba49b66-ace8-4db4-acbd-292b6dde4ced`，以便替换原来的独立通讯侠脚本。
- 不修改通讯侠消息、动态、订阅、社区、预设和窗口位置等业务存储键。

## 安装

1. 在酒馆助手中导入 `install/Freesia-Messenger-GitHub-Direct-v0.3.30.json`，替换原通讯侠脚本。
2. 停用旧的 Permanent Bootstrap 脚本。
3. 刷新酒馆；通讯侠本体由 GitHub CDN 直接加载。
4. 后续只需更新 `core/current/Freesia-Messenger.js`，无需反复导入新的 JSON。

## 回退

保留此前导出的通讯侠 JSON 作为离线救援副本。若 GitHub/CDN 不可用，可停用直连导入包，再启用原本地通讯侠脚本。不要清除站点数据。
