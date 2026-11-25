# Remote Loader Runtime v0.1.2

## 更新诊断

- `getInfo()` 新增 `request` 与 `lastRequest`，记录请求阶段、尝试次数、线路、超时设置、HTTP 状态、耗时、失败类型与原因。
- 区分 Test / Stable Core 清单与 Core 源码请求，明确显示当前检查的更新通道。
- 每次线路请求与回退都会更新状态；成功或失败后保留最近一次请求结果，便于复制诊断。

## 并发与安全

- `checkRemote()` 增加共享 Promise；同时触发的检查复用同一个任务，避免重复下载与状态竞争。
- 保留四线路回退、响应校验、SHA-256 / UTF-8 长度验证、SRI / Blob 加载、IndexedDB LKG / Previous 与失败回滚。
- 保留原有数据库、存储键、Core 数据结构与 Stable / Test 通道设置；无需重新导入 Bootstrap。
