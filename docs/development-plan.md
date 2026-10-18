作者 xuechong 2026-06-19 操作：同步全部功能到开发方案 ｜ 数据库：无

# 开发方案：Quillium（Markdown 编辑器）

> **创建日期**：2026-06-17（持续更新）
> **任务来源**：自有产品需求
> **状态**：v0.4.0 完成

---

## 1. 需求概述

### 1.1 总体分析

- **需求背景**：需要一款轻量、纯粹、类似 Typora 使用体验的 Markdown 编辑器
- **核心目标**：标准的 Markdown 渲染，流畅的编辑与预览体验，Windows 桌面原生性能
- **适用范围**：Windows 平台用户、Markdown 写作者

### 1.2 版本规划

| 版本 | 功能范围 | 状态 |
|------|----------|------|
| v0.1.00 MVP | 项目框架 + 编辑器 + 分屏预览 + 文件操作 | 已完成 |
| v0.1.01 增强 | 多标签、右键菜单、版本记录、路径复制、同步滚动、关闭提醒 | 已完成 |
| v0.2.00 增强 | .md 文件关联、单实例模式、启动文件检测 | 已完成 |
| v0.3.00 增强 | 大纲误解析修复、会话保持重构、自动备份 | 已完成 |
| v0.4.00 | 预览排版修复（typographer 关闭）、配置持久化到 exe 同目录 | 已完成 |
| 未来 | 暗色主题、数学公式（KaTeX）、Mermaid 图表、导出功能 | 规划中 |

---

## 2. 功能清单

- **[REQ-001] 分屏实时预览**：左侧 CodeMirror 6 编辑源码，右侧 markdown-it 实时渲染
- **[REQ-002] 标准 Markdown 渲染**：标题、段落、粗体、斜体、删除线、链接、图片、列表、引用、代码块、水平线、表格、任务列表
- **[REQ-003] CodeMirror 6 编辑器**：语法高亮、行号、当前行高亮、撤销/重做、括号匹配、Tab 缩进
- **[REQ-004] 文件操作**：对话框打开（Ctrl+O）、保存（Ctrl+S）、另存为、拖拽打开 .md 文件
- **[REQ-005] 工具栏**：14 个格式化按钮
- **[REQ-006] 多标签页**：每个文件独立标签，互不覆盖；Ctrl+W 关闭当前标签
- **[REQ-007] 可拖拽分隔条**：调节左右面板宽度（20%~80%）
- **[REQ-008] 同步滚动**：左右面板按内容高度比例同步滚动
- **[REQ-009] 标签右键菜单**：关闭当前、关闭右侧、关闭左侧、关闭所有
- **[REQ-010] 关闭提醒**：窗口关闭时检查未保存文件，弹窗确认防止误关
- **[REQ-011] 会话保持**：关闭软件自动保存标签页列表，重新打开时恢复
- **[REQ-012] 路径显示与复制**：标题栏路径显示，一键复制到剪贴板
- **[REQ-013] Quillium 品牌**：软件名 + 应用图标 + 窗口标题
- **[REQ-014] 版本管理**：标题栏版本按钮，弹窗显示版本记录（Keep a Changelog 格式）
- **[REQ-015] 状态栏**：文件名/文件路径/修改标记、字符数/单词数/行数统计
- **[REQ-016] 自动备份**：按间隔自动备份正在编辑的文件（按日期归档）
- **[REQ-017] 目录大纲**：基于 markdown-it token 流提取标题
- **[REQ-018] 查找替换**：Ctrl+F 搜索栏，支持替换/全部替换
- **[REQ-019] 配置持久化**：设置会话存入 exe 同目录 quillium.json（便携化）

---

## 3. 变更历史

| 日期 | 变更内容 | 变更原因 |
|------|---------|---------|
| 2026-06-17 | 初始方案创建，v0.1.00 框架搭建 | 项目启动 |
| 2026-06-18 | v0.1.00 完成：编辑器 + 预览 + 文件操作 + 工具栏 | 方案与代码对齐 |
| 2026-06-19 | v0.1.01 完成：多标签 + 分隔条 + 同步滚动 + 右键菜单 + 会话保持 + 版本管理 + 路径复制 + 关闭提醒 | 功能增强 |
| 2026-07-03 | v0.2.00 完成：.md 文件关联、单实例模式、启动文件检测 | 功能增强 |
| 2026-08-07 | v0.3.00 完成：大纲误解析修复、版本号统一、注释规范检查 | 用户要求 |
| 2026-08-17 | v0.4.00 完成：预览 typographer 关闭（保持原始引号）、配置持久化 | 用户要求 |

---

## 4. 技术架构

### 4.1 技术栈

| 层级 | 技术 |
|------|------|
| 应用框架 | Tauri 2（Rust 后端） |
| 前端框架 | React 19 |
| 开发语言 | TypeScript（严格模式） |
| 编辑器 | CodeMirror 6 |
| Markdown 解析 | markdown-it |
| 构建工具 | Vite + pnpm |

### 4.2 项目结构

```
quillium/
├── src-tauri/                      # Tauri 后端（Rust）
│   ├── src/
│   │   ├── main.rs                # Rust 入口
│   │   └── lib.rs                 # 文件命令 / 配置读写 / 自动备份 / 单实例 / 关闭拦截
│   ├── capabilities/default.json   # 权限配置
│   ├── Cargo.toml                  # Rust 依赖
│   ├── icons/                      # 图标（由 app-icon.svg 生成）
│   └── tauri.conf.json            # Tauri 配置
├── src/                            # 前端源码
│   ├── components/                 # Editor / Preview / Outline / SearchBar / StatusBar / TabBar / Settings / Changelog
│   ├── hooks/                      # useEditor / useSettings / useConfig
│   ├── utils/                      # markdown-parser / outline-parser / file-system
│   ├── styles/                     # GitHub 风格渲染样式
│   ├── App.tsx / App.css           # 主应用（分屏布局）
│   └── main.tsx                    # React 入口
├── docs/                           # 文档（本文件）
├── app-icon.svg                    # 应用图标源文件
├── build.bat / build-windows.ps1   # 一键编译脚本
├── check-env.ps1                   # 环境检查脚本
├── package.json                    # 依赖配置
├── LICENSE / NOTICE                # Apache-2.0 许可证
└── README.md / BUILD-WINDOWS.md    # 说明文档
```

### 4.3 核心数据流

```
用户输入 (CodeMirror)
    │
    ▼
onChange → setContent(content)
    │
    ├──→ 更新编辑器状态（useEditor 会话保持）
    │
    └──→ useMemo → parseMarkdown(content) → HTML
              │
              ▼
         右侧预览区 (dangerouslySetInnerHTML)
```

---

## 5. 风险评估

| 风险点 | 程度 | 当前状态 |
|--------|------|----------|
| WebView2 兼容性 | 低 | Win10/11 自带 |
| 大文件渲染 | 中 | useMemo 已缓存，待进一步优化 |
| 多语言代码高亮包体积 | 低 | 按需加载 |

---

## 6. 编译产物

| 产物 | 说明 |
|------|------|
| `src-tauri/target/release/Quillium.exe` | 主程序 |
| `src-tauri/target/release/bundle/nsis/Quillium_x.x.x_x64-setup.exe` | NSIS 安装包 |

---

## 7. 编码规范

| 规范 | 说明 |
|------|------|
| TypeScript | 严格模式，完整类型 |
| React | 函数式组件 + Hooks |
| CSS | CSS 文件直接管理，无框架 |
| 注释 | JSDoc 格式，含作者和日期 |
