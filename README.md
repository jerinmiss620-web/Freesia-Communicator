# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。

## 当前加载方式：GitHub 静态 ES Module import

采用与「输入助手」相同的轻量引入形式：

1. **酒馆助手导入包**只保留一条静态 `import 'GitHub 本体地址'`，不包含通讯侠功能代码。
2. **GitHub 本体**保存完整功能代码。日常更新只修改 GitHub 本体，不需要使用者反复下载或导入 JSON。

| 项目 | 路径 | 职责 |
|---|---|---|
| 酒馆助手引入入口 | [GitHub ESM Import JSON](install/Freesia-Messenger-GitHub-ESM-Import-v0.3.35.json) | 只负责静态 import GitHub 本体 |
| 当前本体入口 | [core/current/Freesia-Messenger.js](core/current/Freesia-Messenger.js) | 始终指向当前准备发布的源码 |
| v0.3.35 版本快照 | [core/v0.3.35/Freesia-Messenger.js](core/v0.3.35/Freesia-Messenger.js) | 可追溯的版本文件 |
| 更新记录 | [v0.3.35 CHANGELOG](core/v0.3.35/CHANGELOG.md) | 本次功能与修复记录 |
| 发布清单 | [v0.3.35 release.json](core/v0.3.35/release.json) | 固定源码提交、SHA-256 与 UTF-8 字节长度 |

引入入口使用以下形式：

```js
import 'https://testingcf.jsdelivr.net/gh/jerinmiss620-web/Freesia-Communicator@main/core/current/Freesia-Messenger.js';
```

## 安装 / 更新

1. 首次使用时，在酒馆助手中导入 [GitHub ESM Import JSON](install/Freesia-Messenger-GitHub-ESM-Import-v0.3.35.json) 一次。
2. 若此前启用过旧的 **Permanent Bootstrap**，请停用旧入口，避免重复启动。
3. 刷新酒馆，即从 GitHub 加载当前通讯侠本体。
4. 后续更新只修改 `core/current/Freesia-Messenger.js`；使用者刷新酒馆即可获取更新，**不需要再次下载或导入 JSON**。

## 当前版本

- Communicator Core：**v0.3.35**
- 加载方式：静态 ES Module import（GitHub / jsDelivr）
- 本地导入 JSON：仅作为固定入口，不包含通讯侠本体
- IndexedDB：不参与通讯侠本体加载
- 业务数据：沿用既有 localStorage 键和当前聊天元数据结构

## 救援方式

建议保留此前可用的本地通讯侠 JSON 备份。若 GitHub/CDN 暂时不可用，可停用远程引入入口并启用本地救援副本。不要为了排查加载问题清除酒馆站点数据。

## 旧更新链

`bootstrap/` 与 `loader/` 下的 Bootstrap / Remote Loader 文件仅保留为历史开发记录，不属于 v0.3.35 的安装和启动流程。
