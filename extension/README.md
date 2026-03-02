# PromptForge 小红书采集插件

Chrome 浏览器插件，在小红书笔记页面一键采集内容。

## 安装步骤

1. 生成图标：
```bash
cd extension
node generate-icons.js
```

2. 打开 Chrome，进入 `chrome://extensions/`

3. 开启右上角「开发者模式」

4. 点击「加载已解压的扩展程序」，选择 `extension/` 文件夹

5. 在小红书笔记页面点击插件图标即可采集

## 使用方式

- **复制 JSON**: 将采集数据复制到剪贴板，可粘贴到 PromptForge
- **发送到 PromptForge**: 自动发送数据到已打开的 PromptForge 页面（通过 postMessage）

## 与 PromptForge 前端配合

PromptForge 的「插件采集」tab 会监听来自插件的 `postMessage`，自动接收并显示采集数据。
