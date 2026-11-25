# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。项目采用 GitHub Remote Loader，后续 Core 更新不再要求使用者反复下载、导入完整 JSON。

## 当前发布结构

| 层级 | 当前版本 | 职责 |
|---|---:|---|
| Permanent Bootstrap | 1.0.0 | 本地固定引导脚本，负责加载/更新 Loader |
| Remote Loader Runtime | 0.1.0 | 读取版本清单、验证源码、缓存、安装、健康检查与回滚 |
| Communicator Core | Stable 0.3.22 / Test 0.3.23 | 通讯侠实际功能 |

- Stable 清单：[latest.json](latest.json)
- Test 清单：[channels/test.json](channels/test.json)
- Loader 清单：[loader/latest.json](loader/latest.json)
- 一次性安装包：[Bootstrap 1.0.0 JSON](bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.0.json)

> **当前状态：内部 Test，不是社区正式升级。** Test 通道现为 Core v0.3.23，已实现移动悬浮入口修复、821px 以下全屏、通讯侠/窗口/悬浮球分离控制，以及内部输入控件主题隔离。Stable 仍保持 v0.3.22；PC、Android、iPhone/TavernTogether 实机验证完成前，社区用户暂时不需要迁移。

## 首次迁移

1. 在酒馆助手中**停用**旧的完整通讯侠 v0.3.22 脚本，暂时保留它作为救援副本，不要删除。
2. 下载并导入 [Permanent Bootstrap 1.0.0](bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.0.json)。
3. 启用新导入的 Bootstrap。
4. 刷新酒馆宿主页面。Bootstrap 会加载 Loader，Loader 再下载并验证 Core。
5. 确认通讯侠入口、聊天记录、动态、订阅和设置均正常后，再决定是否长期保留旧脚本副本。

如果首次安装失败，停用 Bootstrap、重新启用旧版完整通讯侠并刷新即可。**不要清除站点数据或聊天数据来处理安装问题。**

## 数据兼容原则

v0.3.23 Core 基于 v0.3.22，保留原通讯侠的存储键与数据结构，不做迁移重命名：

- localStorage：窗口位置、悬浮入口位置、AI 预设、外观、入口显示、主动联络、现实时间感知、正文同步、隐私遮罩、社区模式等。
- 当前聊天元数据：通讯消息、动态、订阅、社区记录。
- 正文同步仍使用原有固定 Prompt ID。

Loader 自身使用独立的全新命名空间与 IndexedDB 数据库，不占用通讯侠业务数据键。

## 更新通道

Stable 是默认通道，目前为 v0.3.22。Test 通道现为 v0.3.23，版本高于 Stable；测试通过后，将同一份已验证源码提升到 Stable。

Loader API 位于酒馆宿主窗口：

```js
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.getInfo()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.setChannel('test')
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.setChannel('stable')
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.checkRemote()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.rollback()
```

切换通道会要求确认；若目标通道版本较旧，只有明确切换通道后才允许回退。普通用户不需要运行这些命令，后续可把通道与更新状态入口整合进通讯侠控制中心。

## 完整性与回滚

- Manifest 固定到 Git Commit 与版本目录。
- Core/Loader 均验证 SHA-256 和 UTF-8 字节长度。
- GitHub Raw、jsDelivr、Fastly 多线路下载；下载镜像不改变 Manifest 中的可信来源和固定 Commit。
- IndexedDB 保存 Candidate、Last Known Good 与 Previous；写入后读回校验。
- 先验证候选源码，再加载；健康检查失败时恢复上一份已验证版本。
- 远程 script + SRI 失败时，可回退到已校验源码的 Blob Script。
- SHA-256 与固定 Commit 提供完整性验证，不等同于发行者数字签名；信任根仍是本 GitHub 仓库。

## 开发与发布

参见 [RELEASING.md](RELEASING.md)、[Loader 说明](loader/README.md) 与 [验证记录](VALIDATION.md)。
