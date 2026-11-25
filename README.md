# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。项目采用 GitHub Remote Loader，后续 Core 更新不再要求使用者反复下载、导入完整 JSON。

## 当前发布结构

| 层级 | 当前版本 | 职责 |
|---|---:|---|
| Permanent Bootstrap | 1.0.2 | 固定启动器；与 Core 共用逐层宿主定位及 Shadow DOM 健康检查 |
| Remote Loader Runtime | 0.1.3 | 读取版本清单、验证源码、缓存、安装、健康检查、请求诊断与回滚 |
| Communicator Core | Stable 0.3.22 / Test 0.3.26 | 通讯侠实际功能 |

- Stable 清单：[latest.json](latest.json)
- Test 清单：[channels/test.json](channels/test.json)
- Test 更新记录：[Core v0.3.26](core/v0.3.26/CHANGELOG.md)
- Loader 清单：[loader/latest.json](loader/latest.json)
- Loader 更新记录：[Runtime v0.1.3](loader/runtime/v0.1.3/CHANGELOG.md)
- Bootstrap 更新记录：[Bootstrap v1.0.2](bootstrap/CHANGELOG-1.0.2.md)
- 一次性安装包：[Bootstrap 1.0.2 JSON](bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.2.json)

> **当前状态：内部 Test，不是社区正式升级。** Test 通道现为 Core v0.3.26。PC 默认使用约 420×780px 的竖向手机应用式浮窗（可在 360–520px 宽度内调整）；821px 以下继续全屏。悬浮球、WindowController、Shadow DOM 和单一扩展总开关保持不变。Stable 仍保持 v0.3.22；PC、Android、iPhone/TavernTogether 实机验证完成前，社区用户暂时不需要迁移。

## 首次迁移与本次启动器升级

1. 在酒馆助手中停用旧的完整通讯侠脚本，保留原 JSON 作为救援副本，不要删除。
2. **如果目前使用 Bootstrap 1.0.1，请停用它，并导入 Bootstrap 1.0.2。** 本次必须更新固定启动器：Core v0.3.25 已改为逐层宿主定位和 Shadow DOM 根节点，旧 Bootstrap/Loader 的宿主定位与健康检查仍按旧 DOM 结构工作。
3. 启用 Bootstrap 1.0.2 并刷新酒馆宿主页面。
4. Bootstrap 会复用原有缓存，升级 Loader 至 0.1.3；Loader 再下载并验证 Core。
5. 确认实际运行版本、通讯入口、聊天记录、动态、订阅和设置正常后，再决定是否长期保留旧脚本副本。

**本次无需清除站点数据、IndexedDB、localStorage 或聊天数据。** Bootstrap 与 Loader 保留原数据库名称、缓存槽位和业务存储键。之后普通 Loader/Core 更新不再要求重新导入 Bootstrap；只有启动协议再次变化时才需要。

如果迁移失败，保留 Bootstrap 1.0.2 和旧版完整通讯侠 JSON，不要清空缓存；先复制 Bootstrap/Loader 诊断再处理。

## 数据兼容原则

v0.3.26 Core 基于 v0.3.25，保留原通讯侠的存储键与数据结构，不做迁移重命名：

- localStorage：窗口位置、悬浮入口位置、AI 预设、外观、入口显示、主动联络、现实时间感知、正文同步、隐私遮罩、社区模式等。
- 当前聊天元数据：通讯消息、动态、订阅、社区记录。
- 正文同步仍使用原有固定 Prompt ID。

Loader 自身使用独立的 Freesia Messenger Remote Loader 命名空间与 IndexedDB 数据库，不占用通讯侠业务数据键。

## 更新通道

Stable 是默认通道，目前为 v0.3.22。Test 通道现为 v0.3.26，版本高于 Stable；测试通过后，将同一份已验证源码提升到 Stable。

Loader API 位于酒馆宿主窗口：

```js
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.getInfo()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.setChannel('test')
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.setChannel('stable')
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.checkRemote()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.rollback()
```

`getInfo()` 会显示当前通道、运行版本、可用版本、自动更新与回滚状态，以及最近一次清单/源码请求的线路、耗时、HTTP 状态和失败原因。

## 完整性与回滚

- Manifest 固定到 Git Commit 与版本目录。
- Core/Loader 均验证 SHA-256 和 UTF-8 字节长度。
- GitHub Raw、jsDelivr、Fastly、TestingCF 四线路下载；可变 Manifest 优先读取 GitHub Raw，固定 Commit 源码优先使用 CDN。任何线路返回内容都必须先通过 JSON/版本/路径/字节长度/SHA-256 校验，失败才切换下一线路。
- IndexedDB 保存 Candidate、Last Known Good 与 Previous；写入后读回校验。
- 先验证候选源码，再加载；健康检查失败时恢复上一份已验证版本。
- 远程 script + SRI 失败时，可回退到已校验源码的 Blob Script。
- Bootstrap、Loader、Core 使用同一套逐层宿主定位；Loader 与 Bootstrap 同时识别旧 DOM 根节点和 v0.3.25 的 Shadow DOM 根节点。
- SHA-256 与固定 Commit 提供完整性验证，不等同于发行者数字签名；信任根仍是本 GitHub 仓库。

## 开发与发布

参见 [RELEASING.md](RELEASING.md)、[Loader 说明](loader/README.md) 与 [验证记录](VALIDATION.md)。
