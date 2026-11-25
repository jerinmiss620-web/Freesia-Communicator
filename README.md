# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。项目采用 GitHub Remote Loader，后续 Core 更新不再要求使用者反复下载、导入完整 JSON。

## 当前发布结构

| 层级 | 当前版本 | 职责 |
|---|---:|---|
| Permanent Bootstrap | 1.0.4 | 固定启动器；localStorage 缓存、完整性读回校验与首次 Core 安全接管 |
| Remote Loader Runtime | 0.1.5 | 验证源码、localStorage 回滚缓存、接管、安装、健康检查与回滚 |
| Communicator Core | Stable 0.3.22 / Test 0.3.29 | 通讯侠实际功能 |

- Stable 清单：[latest.json](latest.json)
- Test 清单：[channels/test.json](channels/test.json)
- Test 更新记录：[Core v0.3.29](core/v0.3.29/CHANGELOG.md)
- Loader 清单：[loader/latest.json](loader/latest.json)
- Loader 更新记录：[Runtime v0.1.5](loader/runtime/v0.1.5/CHANGELOG.md)
- Bootstrap 更新记录：[Bootstrap v1.0.4](bootstrap/CHANGELOG-1.0.4.md)
- 一次性安装包：[Bootstrap 1.0.4 JSON](bootstrap/Freesia-Communicator-Permanent-Bootstrap-1.0.4.json)

> **当前状态：内部 Test，不是社区正式升级。** Stable 仍保持 v0.3.22；Test 为 v0.3.29。Bootstrap / Loader / Core 的首次接管与自动更新链仍需在 ST、TT 实机验证后才可提升 Stable。

## 首次接管与启动器升级

1. 保留原先单独导入的通讯侠 Core JSON，作为救援副本；不要清除站点数据。
2. 在酒馆助手中用 Bootstrap 1.0.4 替换 1.0.3 并启用。
3. Bootstrap 会将 Remote Loader 更新到 0.1.5。若发现当前通讯侠仍由独立脚本运行、尚未建立回滚授权，会提示「接管当前通讯侠」。
4. 确认接管后，Loader 会按当前 Core 版本，从 Test 清单的固定 Git Commit 下载对应历史源码，验证 SHA-256 与 UTF-8 字节长度，并写入、读回校验 Last Known Good。此步骤不会替换当前运行实例。
5. 看到接管成功后，在酒馆助手中停用原来单独导入的通讯侠 Core 脚本，再完整刷新酒馆。
6. Bootstrap / Loader 会从 Last Known Good 恢复当前版本，再检查并安装 Test v0.3.29。自动更新关闭时，可在通讯侠扩展折叠栏的「远程更新」区域手动检查和安装。

**不要在接管成功前停用原 Core，也不要删除旧 JSON。不要清除 localStorage、IndexedDB 或聊天数据。** 新版本的 Bootstrap 与 Loader 使用 localStorage 保存完整源码回滚记录；旧 IndexedDB 数据库保留为兼容数据，不会清除或成为启动前置条件。

## 本次修复内容

- Bootstrap 1.0.4 继续采用与 TLE Bootstrap v1.0.6 一致的直接父窗口宿主定位，并改用 localStorage 缓存，避免 IndexedDB 连接中断阻止启动。
- Loader 0.1.5 将回滚源码缓存改为 localStorage 优先，旧 IndexedDB 读取失败不会再阻断启动。
- Loader 0.1.5 保留固定历史版本接管，并在自动恢复授权存在但 Last Known Good 缺失时重新触发安全接管。
- Test 清单包含 v0.3.22–v0.3.28 的固定 Commit / SHA-256 / 字节长度，供 Loader 安全建立当前版本的回滚副本。
- Core v0.3.29 在现有扩展折叠栏加入「接管当前版本」入口；需要接管时禁用安装按钮，避免跳过回滚保护。

## 数据兼容原则

本次只增加 Loader 接管与更新控制，不更改通讯业务数据结构或现有存储键：

- localStorage：窗口位置、悬浮入口位置、AI 预设、外观、入口显示、主动联络、现实时间感知、正文同步、隐私遮罩、社区模式等。
- 当前聊天元数据：通讯消息、动态、订阅、社区记录。
- 正文同步仍使用原有固定 Prompt ID。
- Loader 使用独立的 Freesia Messenger Remote Loader localStorage 键，不占用通讯侠业务数据键；旧 IndexedDB 数据只作兼容读取。

## 更新通道与接口

Stable 是默认通道，目前为 v0.3.22。Test 通道为 v0.3.29；测试通过后，再将同一份已验证源码提升到 Stable。

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
- localStorage 保存完整 Candidate、Last Known Good 与 Previous 源码记录；写入后读回并验证 SHA-256 与 UTF-8 字节长度。
- 先验证候选源码，再加载；健康检查失败时恢复上一份已验证版本。
- 远程 script + SRI 失败时，可回退到已校验源码的 Blob Script。
- Bootstrap、Loader 与 Core 使用一致的 Tavern Helper 直接父窗口宿主契约。
- SHA-256 与固定 Commit 提供完整性验证，不等同于发行者数字签名；信任根仍是本 GitHub 仓库。

## 开发与发布

参见 [RELEASING.md](RELEASING.md)、[Loader 说明](loader/README.md) 与 [验证记录](VALIDATION.md)。
