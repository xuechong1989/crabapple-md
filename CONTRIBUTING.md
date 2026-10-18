# 参与贡献

感谢参与 crabapple-md！以下约定用于保证协作顺畅。

## 环境准备

- Windows 10/11
- Node.js 20+、pnpm 10+
- Rust（rustup 安装）
- Visual Studio Build Tools（勾选「使用 C++ 的桌面开发」）

## 本地开发

```bash
pnpm install
pnpm tauri dev
```

## 构建

```bash
pnpm build          # 前端类型检查 + 生产构建
pnpm tauri build    # 生成 NSIS 安装包
```

## 代码约定

- 前端在 `src/`，Rust 后端在 `src-tauri/`；
- 修改功能时同步更新 `src/components/Changelog/ChangelogModal.tsx` 的版本记录；
- 版本号需同时保持 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、Changelog 一致（语义化版本，如 `0.4.0`）；
- `pnpm build` 必须通过。

## 安全与隐私

- 不要提交 `.env`、证书、密钥或本机绝对路径；
- 文件读写、单实例、关闭拦截等能力涉及用户本地数据，修改时请说明权限边界；
- 不要引入会静默上传用户文档的依赖或遥测。

## 许可证

贡献的代码将按 [Apache License 2.0](LICENSE) 许可发布。
