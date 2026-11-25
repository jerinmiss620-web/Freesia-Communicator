# Freesia Messenger · 通讯侠 v0.3.37

## 修复：重试提示关闭按钮不可见

- 根因：关闭按钮及点击处理原本已经存在，但按钮内的 SVG 只设置了宽高，没有设置 `fill:none`、`stroke:currentColor` 和描边宽度，导致叉号路径不可见。
- 修正关闭按钮为 28×28px 的独立圆形触控目标，增加可辨识的浅色底和边框。
- 为关闭图标补齐描边颜色、宽度、端点与连接样式，并禁止 SVG 截获按钮点击。
- 保留 `messages-retry-dismiss` 事件、`retryNoticeDismissed` 状态和聊天元数据持久化行为。
- 关闭只隐藏当前失败/中断消息对应的提示；不会删除原消息，也不会自动重试。

## 发布方式

- 正式本体仍由 GitHub `main` 分支的 `core/current/Freesia-Messenger-ESM.js` 提供。
- 已迁移到该 ESM 地址的用户刷新酒馆即可更新，无需重新导入 JSON。
- GitHub Actions 会清理 CDN 缓存，并同时检查版本号、关闭按钮 DOM、事件处理、持久化标记和可见 SVG 描边规则。
