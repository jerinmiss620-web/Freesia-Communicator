# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。

## 当前加载方式：GitHub 本体直连

当前版本采用最简单的两部分结构：

1. **酒馆助手导入包**只保留一段动态 `import()`，负责从 GitHub CDN 加载通讯侠本体。
2. **GitHub 本体**保存完整功能代码。日常更新只修改本体，不需要重新导入大型 JSON。

| 项目 | 路径 | 职责 |
|---|---|---|
| 酒馆助手导入包 | [GitHub Direct JSON](install/Freesia-Messenger-GitHub-Direct-v0.3.35.json) | 小型入口；动态导入本体并报告加载结果 |
| 当前本体入口 | [core/current/Freesia-Messenger.js](core/current/Freesia-Messenger.js) | 始终指向当前准备发布的源码 |
| v0.3.35 版本快照 | [core/v0.3.35/Freesia-Messenger.js](core/v0.3.35/Freesia-Messenger.js) | 可追溯的版本文件 |
| 更新记录 | [v0.3.35 CHANGELOG](core/v0.3.35/CHANGELOG.md) | 本次直连迁移记录 |
| 发布清单 | [v0.3.35 release.json](core/v0.3.35/release.json) | 固定源码提交、SHA-256 与 UTF-8 字节长度 |

导入包使用 `testingcf.jsdelivr.net` 加载 `core/current`，并附加时间戳查询参数。每次重新执行导入脚本时都会请求当前入口，避免旧的 ES Module 缓存阻止获取新版本。

## 安装 / 替换

1. 在酒馆助手中导入 GitHub Direct JSON。导入包保留了原通讯侠脚本 ID，可替换原来的独立 Core 脚本。
2. 停用旧的 **Permanent Bootstrap** 脚本，避免旧更新链再次加载另一份 Core。
3. 刷新酒馆。导入包会从 GitHub 加载当前通讯侠本体。
4. 已安装的直连入口保留原脚本 ID；后续更新只需更新 `core/current/Freesia-Messenger.js`，用户刷新酒馆即可获取新本体，无需反复导入 JSON，也不再需要 Bootstrap 或 Remote Loader。

## 当前版本

- Communicator Core：**v0.3.35**
- 加载方式：GitHub CDN 动态导入
- IndexedDB：不参与通讯侠本体加载
- 业务数据：沿用既有 localStorage 键和当前聊天元数据结构

## 救援方式

建议保留此前可用的本地通讯侠 JSON 备份。若 GitHub/CDN 暂时不可用，可停用直连导入包并启用本地救援副本。不要为了排查加载问题清除酒馆站点数据。

## 旧更新链

`bootstrap/` 与 `loader/` 下的 Bootstrap / Remote Loader 文件仅保留为历史开发记录，不属于 v0.3.35 的安装和启动流程。
