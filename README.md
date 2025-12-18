# Koishi 控制台日志增强

![Version](https://img.shields.io/badge/version-1.2-blue) ![License](https://img.shields.io/badge/license-GPLv3-brightgreen)

为 Koishi 控制台 (Console) 的日志界面添加 **滚动控制** 和 **一键复制** 功能，大幅提升调试体验。

## ✨ 功能特性

### 1. 📜 滚动控制
- **一键暂停/跟踪**：点击顶部标题栏右侧的按钮，即可在“自动跟踪最新日志”和“暂停滚动查看历史”之间切换。
- **智能交互**：
  - **跟踪模式**：有新日志时自动滚动到底部。
  - **暂停模式**：锁定当前视图位置，不再被新日志强制拉回底部，方便安心查看历史报错。

### 2. 📋 一键复制
- **悬停显示**：鼠标悬停在任意日志行上时，右侧会自动出现复制工具栏。
- **双模式支持**：
  - **`T` (Text)**：仅复制日志的正文内容（自动去除时间戳、日志等级前缀），适合粘贴到搜索框或问答。
  - **`All`**：复制该行的完整原始文本。
- **视觉反馈**：复制成功后按钮会变色提示。

## 📸 效果预览

### 滚动控制

<img width="450" height="60" alt="image" src="https://github.com/user-attachments/assets/43295882-34fd-4ab9-88bb-b17a7e5cf607" />

<img width="450" height="60" alt="image" src="https://github.com/user-attachments/assets/e39113df-8f06-4ac3-aa9d-7da9fbc85ef5" />

<img width="450" height="60" alt="image" src="https://github.com/user-attachments/assets/f0df49ef-1143-49ab-b8eb-4027c90567d8" />

<img width="450" height="60" alt="image" src="https://github.com/user-attachments/assets/f2e4faa3-6e2a-4681-94a2-e20614949522" />

### 一键复制

<img width="410" height="130" alt="image" src="https://github.com/user-attachments/assets/f1195b61-c973-431a-b94d-1ef6eb2ba06e" />

<img width="410" height="130" alt="image" src="https://github.com/user-attachments/assets/511bc894-a290-4c54-928e-2324ac911183" />

- **`T` (Text)**

```
Detected GIF image, which is not supported by most models. Please install chatluna-image-service plugin to parse GIF animations.
```

- **`All`**

```
2025-12-18 23:47:54 [W] chatluna Detected GIF image, which is not supported by most models. Please install chatluna-image-service plugin to parse GIF animations.
```

## 🚀 安装方法

你需要先在浏览器中安装脚本管理器，如 **Tampermonkey** (篡改猴)。

1. 安装 Tampermonkey 插件 ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) / [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) / [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/))。

2. 点击下方链接直接安装脚本：
   
   👉 **[点击安装 Koishi Console Log Enhanced](https://github.com/CookSleep/koishi-log-enhanced/raw/main/koishi-log-enhanced.user.js)** 

3. 打开你的 Koishi 控制台日志页面，功能将自动生效。

## 🛠️ 匹配设置

脚本默认匹配了 Koishi 的常用本地端口 `5140`。如果你在服务器或自定义域名上使用，请在 Tampermonkey 编辑器中修改脚本头部的 `@match` 规则：

```javascript
// @match        http://localhost:5140/logs*
// @match        https://your-domain.com/logs*
```

## 📝 原理说明

- **滚动劫持**：通过 `Object.defineProperty` 劫持滚动容器的 `scrollTop` 属性，在暂停状态下拦截 Koishi 前端的自动滚动指令。
- **样式注入**：自动识别暗色/亮色模式，注入 CSS 变量以适配 Koishi 控制台的主题风格。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进代码！
