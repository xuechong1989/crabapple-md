# AGENTS.md

## 项目简介

crabapple-md 是一款基于 Tauri 2 + React 19 + CodeMirror 6 的 Windows Markdown 编辑器。
Rust 后端负责文件读写、配置持久化、自动备份与窗口关闭拦截；前端负责编辑器、预览与 UI。

## 常用命令

```bash
pnpm install       # 安装依赖
pnpm dev           # 仅启动前端（浏览器调试）
pnpm build         # 前端类型检查 + 生产构建（tsc && vite build）
pnpm tauri dev     # 开发模式（完整应用，热重载）
pnpm tauri build   # 打包发布（NSIS 安装包）
node node_modules/@tauri-apps/cli/tauri.js icon app-icon.svg   # 由 app-icon.svg 重新生成全套图标
```

## 本机固定安装目录

- 打包/安装目标：`D:\zzzzzz\crabapple-md`
- 一键构建并安装：`powershell -ExecutionPolicy Bypass -File scripts\build-install.ps1`
- 只安装已构建的 exe：`powershell -ExecutionPolicy Bypass -File scripts\install-local.ps1`
- GitHub Actions 构建：手动运行 `Build Windows` workflow，下载 `crabapple-md-windows` artifact，再执行安装脚本。

## 结构

- `src/` — React 前端
  - `components/`：Editor（CodeMirror）、Preview、Outline、SearchBar、StatusBar、TabBar、Settings、Changelog
  - `hooks/`：useEditor（标签/会话）、useSettings（localStorage）、useConfig（crabapple-md.json 持久化）
  - `utils/`：markdown-parser（markdown-it）、outline-parser（大纲）、file-system
- `src-tauri/` — Rust 后端
  - `src/lib.rs`：文件命令、配置读写、自动备份、单实例、关闭拦截
  - `tauri.conf.json`：productName/identifier/CSP 等
  - `icons/`：由根目录 `app-icon.svg` 生成，勿手改

## 约定

- 修改功能时同步更新 `src/components/Changelog/ChangelogModal.tsx` 中的版本记录（Keep a Changelog + 语义化版本）。
- 代码注释沿用作者 + 日期 + 版本号的格式。
- `pnpm build` 必须通过（含 TypeScript 类型检查）。
