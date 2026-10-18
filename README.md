# Quillium

<img src="src-tauri/icons/128x128.png" width="96" alt="Quillium" />

一款轻量、开箱即用的 **Windows Markdown 编辑器**，基于 Tauri 2 + React 19 + CodeMirror 6 构建。前端负责编辑/预览 UI，Rust 后端负责文件读写、配置持久化、自动备份、单实例与关闭拦截。

## 项目定位与适用范围

Quillium 是 **Windows 桌面应用**，不是 Web 服务，也没有服务端：

- 适合本地 Markdown 写作、会议记录、技术文档；
- 数据保存在用户本地文件系统，不依赖云服务；
- 打包目标为 Windows NSIS；仓库 Release 目前只提供源码快照，不附带 exe，需要按本文从源码构建；
- 不提供云同步、多人协作、插件市场或移动端；
- 文件读写通过 Tauri 命令完成，前端浏览器模式（`pnpm dev`）只能预览 UI，不能调用完整文件系统能力。

## 功能特性

- 分屏实时预览：左侧 Markdown 源码，右侧即时渲染、滚动同步
- 多标签页：独立标签，支持关闭当前/左侧/右侧/全部
- 目录大纲：从 Markdown 标题提取，代码块内 `#` 不误判
- 查找替换：Ctrl+F，支持上一个/下一个/全部替换
- 14 个常用格式工具栏按钮
- 编辑区与预览区代码高亮
- 会话保持：重启恢复标签页与未保存内容
- 自动备份：按配置间隔备份到备份目录（默认 exe 同级 `backup/`）
- 关闭未保存提醒
- 通过拖拽、命令行或系统“打开方式”接收 `.md` / `.markdown`；单实例下在已有窗口新建标签
- 配置默认写入 exe 同目录的 `quillium.json`
- 拖拽打开文件

> 当前 `tauri.conf.json` 未声明 `bundle.fileAssociations`，NSIS 安装包不会自动把 `.md` / `.markdown` 注册为 Quillium 文件。需要双击直接打开时，请在 Windows 设置中手动关联，或先补充 `fileAssociations` 后重新打包。

## 技术栈

| 层级 | 技术 |
|---|---|
| 应用框架 | [Tauri 2](https://tauri.app)（Rust） |
| 前端 | React 19 + TypeScript |
| 编辑器 | [CodeMirror 6](https://codemirror.net) |
| Markdown 解析 | [markdown-it](https://github.com/markdown-it/markdown-it) |
| 构建 | Vite + pnpm |

## 环境要求（Windows 源码构建）

| 依赖 | 要求 |
|---|---|
| 操作系统 | Windows 10/11 x64 |
| Node.js | 20+（与 `.nvmrc` 一致） |
| pnpm | 10+ |
| Rust | stable（rustup 安装） |
| Visual Studio Build Tools | 勾选「使用 C++ 的桌面开发」 |
| WebView2 | Windows 10/11 通常已内置；缺失时安装 Microsoft Edge WebView2 Runtime |

> 项目使用 Tauri 默认的 MSVC 工具链；仓库不提交 `.cargo/config.toml`，不要把本机的 GNU target 或镜像配置写进仓库。

## 安装与开发启动

```bash
git clone https://github.com/xuechong1989/crabapple-md.git
cd crabapple-md

pnpm install
pnpm tauri dev       # 完整桌面应用，热重载
```

只调试前端 UI（没有文件读写/备份/单实例能力）：

```bash
pnpm dev             # Vite，浏览器访问默认 1420 端口
```

前端类型检查与生产构建：

```bash
pnpm build           # tsc && vite build
```

## 打包 Windows 安装包

```bash
cd crabapple-md
pnpm install
pnpm tauri build
```

输出目录：

```text
src-tauri/target/release/
├── Quillium.exe
└── bundle/
    └── nsis/
        └── Quillium_0.4.0_x64-setup.exe
```

也可以双击 `build.bat`，按菜单选择构建/运行/检查环境。详细步骤见 [BUILD-WINDOWS.md](BUILD-WINDOWS.md)。

## 安装后的使用

1. 运行 `Quillium_0.4.0_x64-setup.exe`，按 NSIS 向导安装。
2. 打开应用后，用 `Ctrl+O` 打开 `.md` / `.markdown`，或直接把文件拖入窗口。
3. `Ctrl+S` 保存；关闭有未保存内容的标签/窗口时会提示。
4. 如需双击 `.md` 直接打开，先在 Windows「设置 → 默认应用」中把 `.md` 关联到 Quillium；当前安装包不会自动注册该关联。
5. 在单实例模式下，通过系统“打开方式”再次打开文件，会在已有窗口新建标签。

### 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl+O` | 打开文件 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+W` | 关闭当前标签页 |
| `Ctrl+F` | 查找/替换 |
| `Ctrl+Z` / `Ctrl+Y` | 撤销/重做 |

## 配置与数据

配置文件位于 **exe 同目录**：

```text
quillium.json
```

包含编辑器字号、Tab 大小、备份间隔、`backup_dir`、会话等。删除该文件即恢复默认；放在可写目录时可随应用目录一起拷贝。

自动备份：

- 默认备份目录是 exe 同级 `backup/`；
- 可在 `quillium.json` 的 `backup_dir` 指定其他目录；
- 默认间隔 300 秒，`backup_interval` 可改；
- 备份只针对当前正在编辑的文件，不替代版本控制。

数据边界：

- 文件内容保存在你打开/保存的原始路径；
- Quillium 不上传文件到项目服务器；
- 预览中的远程图片/链接是否加载取决于 Markdown 内容与网络；
- 卸载应用不会自动删除你打开的 Markdown 文件或备份目录；
- 配置文件在 exe 同目录；如果安装到 `Program Files` 等受保护目录，普通用户可能没有写权限，建议安装到用户目录或使用可写的便携目录。

## 测试与检查

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

当前没有独立的前端单元测试脚本；`pnpm build` 包含 TypeScript 类型检查，CI 还会执行 `cargo check`。CI 见 [.github/workflows/ci.yml](.github/workflows/ci.yml)。

## 已知限制

- Release 目前只有源码快照，没有附加 NSIS `.exe`；需要安装包时请按上面的步骤构建。
- NSIS 配置未声明 `fileAssociations`，不会自动注册 `.md` / `.markdown` 文件关联。
- 配置和备份默认在 exe 同目录；安装在只读目录时需要额外处理写权限。
- 当前只配置 Windows NSIS 打包，macOS/Linux 未配置。

## 常见构建问题

- `link.exe not found`：安装 Visual Studio Build Tools，选择「使用 C++ 的桌面开发」。
- `Windows SDK version` 错误：在 Visual Studio Installer 中安装/更新 Windows SDK。
- 启动白屏/缺 DLL：安装 WebView2 Runtime。
- crates.io 下载慢：在本机 `%USERPROFILE%\.cargo\config.toml` 配镜像，**不要提交到仓库**。
- 不要强制 `target = "x86_64-pc-windows-gnu"`；本项目按 MSVC 构建。

## 适用与不适用

**适合：**

- Windows 上想要轻量、本地优先 Markdown 编辑器的用户；
- 需要多标签、大纲、查找替换、自动备份的写作者；
- 想基于 Tauri 2 + React 二次开发的开发者。

**不适合：**

- macOS/Linux 用户（当前未配置对应打包）；
- 需要云同步、多人实时协作、插件生态的用户；
- 想把编辑器当 Web 服务部署的场景。

## 许可证

[Apache License 2.0](LICENSE) © 2026 xuechong。第三方组件许可见 [NOTICE](NOTICE)。
