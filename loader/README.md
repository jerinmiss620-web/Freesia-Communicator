# Freesia Messenger Remote Loader

当前 Remote Loader Runtime 为 v0.1.6，由 Permanent Bootstrap v1.0.5 持有。Loader 不创建第二套通讯 UI，也不修改通讯侠业务数据。

## 职责

- 读取 Stable 或 Test Core Manifest。
- 校验项目、通道、版本、固定 Commit、源码路径、SHA-256 与 UTF-8 字节数。
- GitHub Raw、jsDelivr、Fastly、TestingCF 四线路顺序回退；任何线路返回内容都必须先通过完整性校验。
- 使用经典 script + SRI 加载；网络/CORS/SRI 不可用时回退到已校验的 Blob Script。
- 使用 localStorage 保存 Candidate、Last Known Good 与 Previous 完整源码记录；每次写入后读回并验证 SHA-256、UTF-8 字节长度和版本号。
- IndexedDB 只用于读取旧版本遗留的 LKG / Previous 缓存；它是可选兼容路径，不参与新版本 Candidate 暂存、LKG 写入或 Previous 写入。
- IndexedDB 连接丢失、重连失败或数据库不可用时，按旧缓存缺失处理并继续远程安全安装；不会清理旧数据库。
- 健康检查失败时尝试恢复上一份已验证版本。
- 自动恢复已授权缓存、周期检查远程版本、网络恢复后重试。
- `checkRemote()` 使用共享 Promise；并发触发的检查复用同一个请求任务。
- Bootstrap、Loader 与 Core 使用一致的 Tavern Helper 直接父窗口宿主契约。
- `getInfo()` 提供当前通道、版本、缓存状态，以及最近一次请求的阶段、线路、尝试次数、超时、HTTP 状态、耗时和失败原因。

## 通道

- `stable`：默认；读取根目录 `latest.json`。
- `test`：读取 `channels/test.json`。

通过 `window.__FREESIA_MESSENGER_REMOTE_LOADER_V1__.setChannel('test')` 切换到测试通道；切换时需要用户确认。切换回 Stable 时，如目标版本较旧，也会要求确认后才允许降级。通道选择保存在独立 localStorage 键中，刷新后仍然保留。

Core 版本号必须跨通道单调递增；不要在相同版本号下发布不同源码。

## 存储隔离

Loader 使用独立的 Freesia Messenger Remote Loader localStorage 键。Candidate、Last Known Good 与 Previous 保存完整、已校验的源码记录；候选记录在安装结束后清理。旧 IndexedDB 数据库及其记录不会删除，也不会成为启动或更新的前置条件。

## 安全更新

- 先下载并验证候选源码，再将其写入 localStorage 并读回校验。
- 更新前确认上一版本回滚记录与当前运行 Core 版本一致。
- 健康检查失败时恢复上一份已验证源码。
- Bootstrap 在迁移旧 Loader 时，会先从固定 Commit 获取并保存旧 Loader 回滚源码，避免新 Bootstrap 没有本地缓存时无法接管。
- 远程 script + SRI 失败时，可回退到已校验源码的 Blob Script。
