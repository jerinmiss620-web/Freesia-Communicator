# Freesia Messenger · 通讯侠

SillyTavern / Tavern Helper 的独立通讯面板。

## 当前正式版本：v0.3.37

### GitHub 静态 ES Module 引入

- 酒馆助手 JSON 只保留一条静态 `import`，不内嵌通讯侠本体。
- 完整功能代码保存在 GitHub：`core/current/Freesia-Messenger-ESM.js`。
- 首次安装导入 [GitHub ESM Import JSON](install/Freesia-Messenger-GitHub-ESM-Import-v0.3.37.json) 一次。
- 后续只更新 GitHub 本体；GitHub Actions 自动刷新 CDN 并验证实际返回内容，用户刷新酒馆即可更新，不需要反复导入 JSON。

正式导入语句：

```js
import 'https://testingcf.jsdelivr.net/gh/jerinmiss620-web/Freesia-Communicator@main/core/current/Freesia-Messenger-ESM.js';
```

| 文件 | 用途 |
|---|---|
| [当前正式本体](core/current/Freesia-Messenger-ESM.js) | 已安装入口加载的完整源码 |
| [v0.3.37 版本快照](core/v0.3.37/Freesia-Messenger.js) | 不可变正式版本 |
| [v0.3.37 更新记录](core/v0.3.37/CHANGELOG.md) | 重试提示关闭按钮可见性修复 |
| [v0.3.37 发布清单](core/v0.3.37/release.json) | 固定源码提交、SHA-256 和字节长度 |
| [v0.3.37 导入入口](install/Freesia-Messenger-GitHub-ESM-Import-v0.3.37.json) | 酒馆助手静态 import 包 |

## v0.3.37 修复

重试提示的关闭按钮此前已有 DOM、点击事件和持久化状态，但 SVG 缺少描边样式，导致叉号不可见。v0.3.37 为按钮提供明确的 28×28px 触控区域、可见背景/边框，以及完整的 SVG 描边规则。关闭只隐藏该条失败提示，不删除消息，也不触发重试。

## 更新与迁移

- 已使用 `core/current/Freesia-Messenger-ESM.js` 地址的用户：刷新酒馆即可，无需重新导入。
- 仍使用旧的 `core/current/Freesia-Messenger.js` 地址的用户：需要一次性替换入口，以后不再需要反复导入。
- 若此前启用旧的 Permanent Bootstrap，请停用，避免重复启动。
- 不要为更新通讯侠而清除酒馆站点数据。

## 验证规则

正式发布必须通过源码哈希、字节长度、JavaScript 语法、业务存储键、导入入口和 CDN 实际响应检查。CDN 检查同时验证版本号、重试关闭按钮 DOM、点击处理、持久化标记和 SVG 描边样式；未通过不得宣布交付。
