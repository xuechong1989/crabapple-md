# crabapple-md Windows 编译说明

> 作者 xuechong 2026-06-17 ｜ 适用于 crabapple-md v0.4.0

## 环境要求

### 1. 安装 Node.js
- 下载地址：https://nodejs.org
- 版本要求：20.x 或更高（与 `.nvmrc` 和 package.json engines 一致）
- 安装后验证：
  ```bash
  node --version
  npm --version
  ```

### 2. 安装 pnpm
```bash
npm install -g pnpm
```

### 3. 安装 Rust
- 下载地址：https://rustup.rs
- 运行 `rustup-init.exe` 并按提示安装
- 安装后验证：
  ```bash
  rustc --version
  cargo --version
  ```

### 4. 安装 Visual Studio Build Tools
- 下载地址：https://visualstudio.microsoft.com/visual-cpp-build-tools/
- 安装时选择「使用 C++ 的桌面开发」工作负载
- 这是编译 Rust 原生代码所必需的

## 编译步骤

### 1. 安装依赖
```bash
pnpm install
```

### 2. 编译发布版本
```bash
pnpm tauri build
```

### 3. 编译调试版本（可选）
```bash
pnpm tauri dev
```

也可以直接双击 `build.bat`，按菜单选择「构建并运行 / 仅构建 / 开发模式 / 检查环境」。

## 输出文件

编译完成后，产物位于：

```
src-tauri/target/release/
├── crabapple-md.exe                 # 主程序
└── bundle/nsis/
    └── crabapple-md_0.4.0_x64-setup.exe   # NSIS 安装包
```

## 本机固定安装目录

本机打包/安装统一到：

```text
D:\zzzzzz\crabapple-md
```

一键构建并复制：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-install.ps1
```

只安装已经构建好的 exe：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-local.ps1
```

也可以手动运行 GitHub Actions 的 `Build Windows` workflow，下载 `crabapple-md-windows` artifact 后执行安装脚本。

## 常见问题

### Q1: 编译时提示 "link.exe" not found
A: 需要安装 Visual Studio Build Tools，并确保选择了「使用 C++ 的桌面开发」工作负载。

### Q2: 编译时提示 Windows SDK 版本错误
A: 安装最新版本的 Windows SDK，或在 Visual Studio Installer 中更新。

### Q3: 运行时提示缺少 DLL / 白屏
A: 安装 Microsoft Edge WebView2 Runtime（Windows 10/11 通常已内置）：
https://developer.microsoft.com/microsoft-edge/webview2/

### Q4: crates.io 下载依赖缓慢
A: 项目默认使用 crates.io 官方源。国内网络如需加速，可在 `%USERPROFILE%\.cargo\config.toml` 中自行配置镜像，不要写入仓库。
