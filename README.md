# Quillium

<img src="src-tauri/icons/128x128.png" width="96" alt="Quillium" />

一款轻量、纯粹、开箱即用的 Windows Markdown 编辑器 —— 基于 **Tauri 2 + React 19 + CodeMirror 6** 构建。

A lightweight and elegant Markdown editor for Windows, built with Tauri 2 + React 19 + CodeMirror 6.

## 特性

- **分屏实时预览**：左侧编辑 Markdown 源码，右侧即时渲染，滚动同步
- **多标签页**：每个文件独立标签，支持右键「关闭当前 / 关闭左侧 / 关闭右侧 / 关闭全部」
- **目录大纲**：自动提取标题生成大纲（与预览渲染完全一致，代码块内 `#` 不会被误判）
- **查找替换**：内置搜索栏（Ctrl+F），支持上一个 / 下一个 / 全部替换
- **工具栏**：14 个常用格式化按钮（标题、加粗、斜体、引用、列表、表格、链接、图片等）
- **代码高亮**：编辑区与预览区均支持多语言代码语法高亮
- **会话保持**：重启后自动恢复上次的标签页与未保存内容
- **自动备份**：按设定间隔自动备份正在编辑的文件（按日期归档到备份目录）
- **未保存提醒**：关闭窗口前弹出原生确认框，防止误关丢稿
- **文件关联**：双击 `.md` / `.markdown` 文件直接在 Quillium 中打开；单实例模式下自动新建标签页
- **便携配置**：设置与会话保存为 exe 同目录的 `quillium.json`，整个目录随拷随用
- **拖拽打开**：将 Markdown 文件拖入窗口即可打开

## 技术栈

| 层级 | 技术 |
|------|------|
| 应用框架 | [Tauri 2](https://tauri.app)（Rust） |
| 前端框架 | React 19 + TypeScript |
| 编辑器 | [CodeMirror 6](https://codemirror.net) |
| Markdown 解析 | [markdown-it](https://github.com/markdown-it/markdown-it) |
| 构建工具 | Vite + pnpm |

## 下载安装

前往本仓库 **Releases** 页面下载最新版 NSIS 安装包（`.exe`）安装即可。

## 从源码构建

> 详细步骤见 [BUILD-WINDOWS.md](BUILD-WINDOWS.md)，也可直接双击 `build.bat` 一键构建。

环境要求（Windows 10/11）：

1. [Node.js](https://nodejs.org) 20+ 和 pnpm：`npm install -g pnpm`
2. [Rust](https://rustup.rs)（rustup 安装）
3. [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（勾选「使用 C++ 的桌面开发」）

```bash
pnpm install        # 安装依赖
pnpm tauri dev      # 开发模式（热重载）
pnpm tauri build    # 打包发布，产物在 src-tauri/target/release/bundle/nsis/
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+W` | 关闭当前标签页 |
| `Ctrl+F` | 查找 / 替换 |
| `Ctrl+Z` / `Ctrl+Y` | 撤销 / 重做 |

## 配置文件

所有设置保存在 exe 同目录下的 `quillium.json`（编辑器字号、Tab 大小、自动备份间隔等），无需注册表，删除即恢复默认。

## 致谢

本项目基于以下优秀开源项目构建：[Tauri](https://tauri.app)、[React](https://react.dev)、[CodeMirror](https://codemirror.net)、[markdown-it](https://github.com/markdown-it/markdown-it)、[Vite](https://vite.dev)。

## 许可证

[Apache License 2.0](LICENSE) © 2026 xuechong
