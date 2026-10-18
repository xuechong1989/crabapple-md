# 安全政策

## 支持范围

当前维护 `main` 分支，安全修复会合入最新版本。

## 报告安全问题

请勿通过公开 Issue 披露安全问题。请在 GitHub 仓库的 Security 页面使用「Report a vulnerability」私密报告，或直接联系仓库维护者。

报告中建议包含：问题描述、影响范围、复现步骤、可能的修复建议。

## 安全边界

Quillium 是本地 Markdown 编辑器，会读写用户选择的文件，相关实现请重点评审：

- 文件打开/保存/另存为与拖拽打开
- 自动备份目录与会话恢复
- 单实例与文件关联启动参数
- Tauri CSP 与前端依赖供应链

## 依赖安全说明

- 前端已升级 `markdown-it`、`linkify-it`、`postcss`、`source-map-js`、`esbuild` 到修复版本。
- `src-tauri/Cargo.lock` 中 `glib` 仍有 medium 公告，修复版本 0.20.0；它来自 Linux GTK 依赖链，升级需要同步 Tauri/GTK 版本并在 Linux 上回归。Windows 构建不编译该依赖。
- 其他依赖告警以 GitHub Security 页的 Dependabot 列表为准。

## 处理流程

- 收到报告后 3 个工作日内确认；
- 修复发布前请勿公开披露细节；
- 修复完成后会在 Release Notes 中致谢（如需匿名请提前说明）。
