# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。项目采用 GitHub Remote Loader，后续 Core 更新不再要求使用者反复下载、导入完整 JSON。

## 当前发布结构

| 层级 | 当前版本 | 职责 |
|---|---:|---|
| Permanent Bootstrap | 1.0.3 | 固定启动器；直接绑定 Tavern Helper 宿主窗口，检测 Core 健康状态并引导首次安全接管 |
| Remote Loader Runtime | 0.1.4 | 读取版本清单、验证源码、接管当前 Core、缓存、安装、健康检查与回滚 |
| Communicator Core | Stable 0.3.22 / Test 0.3.28 | 通讯侠实际功能 |

- Stable 清单：[latest.json](latest.json)
- Test 清单：[channels/test.json](channels/test.json)
- Test 更新记录：[Core v0.3.28](core/v0.3.28/CHANGELOG.md)
- Loader 清单：[loader/latest.json](loader/latest.json)
- Loader 更新记录：[Runtime v0.1.4](loader/runtime/v0.1.4/CHANGELOG.md)
- Bootstrap 更新记录：[Bootstrap v1.0.3](bootstrap/CHANGELOG-1.0.3.md)
- 一次性安装包：[Bootstrap 1.0.3 JSON](bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.3.json)

> **当前状态：内部 Test，不是社区正式升级。** Stable 仍保持 v0.3.22；Test 为 v0.3.28。Bootstrap / Loader / Core 的首次接管与自动更新链仍需在 ST、TT 实机验证后才可提升 Stable。

## 首次接管与启动器升级

1. 保留原先单独导入的通讯侠 Core JSON，作为救援副本；不要清除站点数据。
2. 在酒馆助手中停用 Bootstrap 1.0.2，导入并启用 Bootstrap 1.0.3。
3. Bootstrap 会将 Remote Loader 更新到 0.1.4。若发现当前通讯侠仍由独立脚本运行、尚未建立回滚授权，会提示「接管当前通讯侠」。
4. 确认接管后，Loader 会按当前 Core 版本，从 Test 清单的固定 Git Commit 下载对应历史源码，验证 SHA-256 与 UTF-8 字节长度，并写入、读回校验 Last Known Good。此步骤不会替换当前运行实例。
5. 看到接管成功后，在酒馆助手中停用原来单独导入的通讯侠 Core 脚本，再完整刷新酒馆。
6. Bootstrap / Loader 会从 Last Known Good 恢复当前版本，再检查并安装 Test v0.3.28。自动更新关闭时，可在通讯侠扩展折叠栏的「远程更新」区域手动检查和安装。

**不要在接管成功前停用原 Core，也不要删除旧 JSON。不要清除 localStorage、IndexedDB 或聊天数据。** Bootstrap 与 Loader 保留原数据库名称、缓存槽位和业务存储键。

## 本次修复内容

- Bootstrap 1.0.3 采用与 TLE Bootstrap v1.0.6 相同的直接父窗口宿主定位；Core 健康检查不再要求 `remoteLoaderManaged`，避免把已正常运行的独立 Core 误判为启动失败。
- Loader 0.1.4 修正通讯侠 Core 不暴露 `state.destroyed` 字段导致的活动实例误判。
- Loader 0.1.4 的 `adoptCurrent()` 支持从固定历史发布记录接管低于远程最新版本的 Core，不再要求当前版本等于候选最新版本。
- Test 清单包含 v0.3.22–v0.3.27 的固定 Commit / SHA-256 / 字节长度，供 Loader 安全建立当前版本的回滚副本。
- Core v0.3.28 在现有扩展折叠栏加入「接管当前版本」入口；需要接管时禁用安装按钮，避免跳过回滚保护。

## 数据兼容原则

本次只增加 Loader 接管与更新控制，不更改通讯业务数据结构或现有存储键：

- localStorage：窗口位置、悬浮入口位置、AI 预设、外观、入口显示、主动联络、现实时间感知、正文同步、隐私遮罩、社区模式等。
- 当前聊天元数据：通讯消息、动态、订阅、社区记录。
- 正文同步仍使用原有固定 Prompt ID。
- Loader 使用独立的 Freesia Messenger Remote Loader 命名空间与 IndexedDB 数据库，不占用通讯侠业务数据键。

## 更新通道与接口

Stable 是默认通道，目前为 v0.3.22。Test 通道为 v0.3.28；测试通过后，再将同一份已验证源码提升到 Stable。

Loader API 位于酒馆宿主窗口：

```js
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.getInfo()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.setChannel('test')
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.setChannel('stable')
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.checkRemote()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.adoptCurrent()
window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__?.rollback()
```

`getInfo()` 会显示当前通道、运行版本、可用版本、自动更新与回滚状态，以及最近一次清单/源码请求的线路、耗时、HTTP 状态和失败原因。

## 完整性与回滚

- Manifest 固定到 Git Commit 与版本目录。
- Core / Loader 均验证 SHA-256 和 UTF-8 字节长度。
- GitHub Raw、jsDelivr、Fastly、TestingCF 四线路下载；任何线路返回内容都必须先通过 JSON / 版本 / 路径 / 字节长度 / SHA-256 校验。
- IndexedDB 保存 Candidate、Last Known Good 与 Previous；写入后读回校验。
- 先验证候选源码，再加载；健康检查失败时恢复上一份已验证版本。
- 远程 script + SRI 失败时，可回退到已校验源码的 Blob Script。
- Bootstrap、Loader 与 Core 使用一致的 Tavern Helper 直接父窗口宿主契约。
- SHA-256 与固定 Commit 提供完整性验证，不等同于发行者数字签名；信任根仍是本 GitHub 仓库。

## 开发与发布

参见 [RELEASING.md](RELEASING.md)、[Loader 说明](loader/README.md) 与 [验证记录](VALIDATION.md)。
