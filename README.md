# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。

## 当前正式版本：Core v0.3.38

### 两种安装方式

通讯侠提供两种互相独立的安装入口，**不要同时启用两种入口**。

#### 方式 A：Permanent Bootstrap（推荐用于远程更新）

- 导入 [Permanent Bootstrap 1.0.8 Stable](install/Freesia-Messenger-Permanent-Bootstrap-1.0.8.json) 并启用。
- 单入口更新链：Bootstrap 1.0.8 → Remote Loader 0.1.9 → Core 0.3.38。
- 用户只需管理 Bootstrap；不需要另外导入或启用 Loader。
- Bootstrap 先检查远程 Loader；已验证缓存只作为离线回退，并保留上一版本以便恢复。
- 自动更新可在通讯侠现有扩展设置中关闭；手动更新仍保留确认流程。

#### 方式 B：GitHub 静态 ES Module 引入

- 首次安装导入 [GitHub ESM Import JSON](install/Freesia-Messenger-GitHub-ESM-Import-v0.3.38.json) 一次。
- 酒馆助手 JSON 只保留一条静态 `import`，不内嵌通讯侠本体。
- 已安装该入口的用户无需重复导入；后续更新 `core/current/Freesia-Messenger-ESM.js` 后刷新酒馆即可。

正式导入语句：

```js
import 'https://testingcf.jsdelivr.net/gh/jerinmiss620-web/Freesia-Communicator@main/core/current/Freesia-Messenger-ESM.js';
```

| 文件 | 用途 |
|---|---|
| [Permanent Bootstrap 1.0.8](install/Freesia-Messenger-Permanent-Bootstrap-1.0.8.json) | 单入口远程更新安装包 |
| [当前正式本体](core/current/Freesia-Messenger-ESM.js) | GitHub ESM 入口加载的完整源码 |
| [v0.3.38 版本快照](core/v0.3.38/Freesia-Messenger.js) | 不可变正式版本 |
| [v0.3.38 更新记录](core/v0.3.38/CHANGELOG.md) | 移动端窗口尺寸选项 |
| [v0.3.38 发布清单](core/v0.3.38/release.json) | 固定源码 Commit、SHA-256 和字节长度 |
| [v0.3.38 ESM 导入入口](install/Freesia-Messenger-GitHub-ESM-Import-v0.3.38.json) | GitHub 静态 import 包 |
| [Bootstrap 1.0.8 更新说明](bootstrap/CHANGELOG-1.0.8.md) | 远程更新链迁移修复 |

## Core v0.3.38 新增

### 移动端窗口尺寸选项

- 在酒馆助手「通讯侠」现有扩展折叠内容中增加「移动端窗口尺寸」设置。
- 默认 100% 全屏；可选 90% 视口尺寸，窗口居中并恢复圆角、边框和轻阴影。
- 选择自动保存，刷新或重新加载后保留。
- 仅作用于移动端；PC 窗口尺寸、拖动、缩放、最大化和悬浮球行为不变。

## Bootstrap 1.0.8 迁移修复

- 远程 Loader 优先：启动时先检查并安装当前远程版本，已验证缓存仅用于离线回退。
- 旧 Loader 正在执行操作时，最多等待 45 秒；超时保留当前版本，不强行中断。
- 合并旧 Loader 的过期启动提示，避免旧版本清单造成误导。
- 远程 Loader 低于已验证缓存时拒绝降级。
- 保留 Stable / Test 通道偏好、原脚本 ID、Core API、聊天数据和用户设置。
- 不需要清除酒馆站点数据。

## 更新与迁移

- Permanent Bootstrap 与 GitHub ESM Import 是两种独立安装方式，不应同时启用。
- 切换安装方式时停用旧入口即可；不要为更新通讯侠清除酒馆站点数据。
- 只使用一份 Permanent Bootstrap；不要再单独启用 Remote Loader。
- Stable 更新链使用 `main`；Test 通道通过 `main/channels/test.json` 管理。

## 验证边界

- Bootstrap 1.0.8 的 TT 实机更新链已验证：成功启动，实际运行 Core v0.3.38，加载速度正常。
- 代码完整性、SHA-256、UTF-8 字节长度及语法由发布工作流检查。
- 不同 Android 设备、ST 与 iPhone Safari 的表现仍建议按实际环境回归；自动化检查不替代实机验证。
