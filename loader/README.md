# Freesia Messenger Remote Loader

Loader Runtime v0.1.2 是无独立面板的 headless 管理层，由 Permanent Bootstrap v1.0.1 持有。它不另建一套通讯 UI，也不改变通讯侠业务数据。

## 职责

- 读取 Stable 或 Test Core Manifest。
- 校验项目、通道、版本、固定 Commit、源码路径、SHA-256 与 UTF-8 字节数。
- GitHub Raw、jsDelivr、Fastly、TestingCF 四线路顺序回退；可变 Manifest 优先官方源，固定 Commit 源码优先 CDN。
- 每条线路均在接受响应前执行 JSON/清单或源码校验；HTTP 200 但内容错误、版本/路径不匹配、字节长度或 SHA-256 不匹配，也会尝试下一线路。
- 使用经典 script + SRI 加载；网络/CORS/SRI 不可用时回退到已校验的 Blob Script。
- 使用独立 IndexedDB 保存 Candidate、Last Known Good 与 Previous，并读回验证。
- 在 Core 健康检查失败时尝试恢复上一份已验证版本。
- 自动恢复已授权缓存、周期检查远程版本、网络恢复后重试。
- `checkRemote()` 使用共享 Promise；并发触发的检查复用同一个请求任务。
- `getInfo()` 提供当前通道、版本、缓存状态，以及最近一次请求的阶段、线路、尝试次数、超时、HTTP 状态、耗时和失败原因。
- 提供 `getInfo()`、`checkRemote()`、`loadRemote()`、`rollback()`、`setChannel()` 等只读/控制 API。

## 通道

- `stable`：默认；读取根目录 `latest.json`。
- `test`：读取 `channels/test.json`。

通过 `window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__.setChannel('test')` 切换到测试通道；切换时需要用户确认。切换回 Stable 时，如目标版本较旧，也会要求确认后才允许降级。通道选择保存在独立 localStorage 键中，刷新后仍然保留。

Core 版本号必须跨通道单调递增；不要在相同版本号下发布不同源码。

## 存储隔离

Loader 的 localStorage 键和 IndexedDB 数据库均使用 Freesia Messenger Remote Loader 专属命名空间。通讯侠现有业务键保持不变。
