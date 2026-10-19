@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title crabapple-md 一键构建

REM ============================================================
REM  crabapple-md 一键构建脚本
REM  作者：xuechong 2026-10-19  v0.4.0
REM  用途：下载源码后双击本文件，自动准备环境并生成 NSIS 安装包
REM  说明：缺失的依赖通过 winget 静默安装，全程无需人工干预，
REM        仅 Visual Studio Build Tools〈约 4GB〉安装前会先询问
REM ============================================================

cd /d "%~dp0"

echo.
echo ==========================================
echo    crabapple-md 一键构建
echo    完成后自动打开安装包所在目录
echo ==========================================
echo.
echo 提示：首次运行需要下载依赖，全程约 10~20 分钟。
echo.

REM ---------- 步骤 1/5：Node.js ----------
call :check_cmd node
if errorlevel 1 (
    echo [1/5] 未检测到 Node.js，正在自动安装……
    call :winget_install OpenJS.NodeJS.LTS
    if errorlevel 1 (
        echo [错误] Node.js 自动安装失败，请手动安装后重新运行本脚本：
        echo        https://nodejs.org/zh-cn 〈选择 LTS 版本〉
        pause
        exit /b 1
    )
    call :refresh_path
    call :check_cmd node
    if errorlevel 1 (
        echo [错误] Node.js 已安装但当前窗口未识别，请关闭本窗口后重新双击运行。
        pause
        exit /b 1
    )
)
echo [1/5] Node.js 已就绪

REM ---------- 步骤 2/5：pnpm ----------
call :check_cmd pnpm
if errorlevel 1 (
    echo [2/5] 未检测到 pnpm，正在通过 npm 自动安装……
    call npm install -g pnpm
    if errorlevel 1 (
        echo [错误] pnpm 自动安装失败，请手动执行：npm install -g pnpm
        pause
        exit /b 1
    )
    call :refresh_path
    call :check_cmd pnpm
    if errorlevel 1 (
        echo [错误] pnpm 已安装但当前窗口未识别，请关闭本窗口后重新双击运行。
        pause
        exit /b 1
    )
)
echo [2/5] pnpm 已就绪

REM ---------- 步骤 3/5：Rust ----------
call :check_cmd cargo
if errorlevel 1 (
    echo [3/5] 未检测到 Rust，正在自动安装……
    call :winget_install Rustlang.Rustup
    if errorlevel 1 (
        echo [错误] Rust 自动安装失败，请手动安装后重新运行本脚本：
        echo        https://rustup.rs 〈默认选项安装即可〉
        pause
        exit /b 1
    )
    set "PATH=%PATH%;%USERPROFILE%\.cargo\bin"
    rustup default stable-x86_64-pc-windows-msvc
    if errorlevel 1 (
        echo [错误] Rust 工具链下载失败，请检查网络后重新运行本脚本。
        pause
        exit /b 1
    )
)
echo [3/5] Rust 已就绪

REM ---------- 步骤 4/5：MSVC 编译环境 ----------
call :check_msvc
if errorlevel 1 (
    echo [4/5] 未检测到 Visual Studio Build Tools〈C++ 编译环境〉。
    echo        自动安装需下载约 4GB，耗时较长。
    choice /c YN /n /m "现在自动安装吗？〈Y=安装，N=取消〉"
    if errorlevel 2 (
        echo 已取消。请手动安装后重新运行本脚本：
        echo        https://visualstudio.microsoft.com/visual-cpp-build-tools/
        echo        安装时勾选「使用 C++ 的桌面开发」。
        pause
        exit /b 1
    )
    echo 正在安装 Visual Studio Build Tools，请耐心等待……
    winget install --id Microsoft.VisualStudio.2022.BuildTools -e --silent --accept-package-agreements --accept-source-agreements --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    if errorlevel 1 (
        echo [错误] Build Tools 安装失败，请手动安装后重新运行本脚本。
        pause
        exit /b 1
    )
    call :check_msvc
    if errorlevel 1 (
        echo [错误] 安装已完成但未检测到 MSVC 工具链，请重新运行本脚本确认。
        pause
        exit /b 1
    )
)
echo [4/5] MSVC 编译环境已就绪

REM ---------- 步骤 5/5：安装依赖并构建 ----------
echo [5/5] 安装前端依赖……
call pnpm install
if errorlevel 1 (
    echo 依赖安装失败，自动重试一次……
    call pnpm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络〈或代理〉后重新运行本脚本。
        pause
        exit /b 1
    )
)

echo [5/5] 正在构建安装包，首次编译约 10~15 分钟，请勿关闭窗口……
call pnpm tauri build
if errorlevel 1 (
    echo.
    echo [错误] 构建失败。常见原因与解决办法见 BUILD-WINDOWS.md 的「常见问题」。
    pause
    exit /b 1
)

REM ---------- 收尾：复制产物到浅目录并定位 ----------
REM Tauri 的产物固定生成在 src-tauri\target 深处且无法配置输出位置，
REM 这里复制到仓库根的 release\ 目录，方便用户直接取用
set "SETUP_DIR=src-tauri\target\release\bundle\nsis"
set "APP_EXE=src-tauri\target\release\crabapple-md.exe"
set "OUT_DIR=release"
set "SETUP_EXE="
for /f "delims=" %%F in ('dir /b /o-d "%SETUP_DIR%\*setup.exe" 2^>nul') do (
    if not defined SETUP_EXE set "SETUP_EXE=%%F"
)

if defined SETUP_EXE (
    if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
    del /q "%OUT_DIR%\crabapple-md*.exe" >nul 2>nul
    copy /y "%SETUP_DIR%\%SETUP_EXE%" "%OUT_DIR%\" >nul
    if exist "%APP_EXE%" copy /y "%APP_EXE%" "%OUT_DIR%\" >nul
)

echo.
echo ==========================================
echo    构建成功！
if defined SETUP_EXE (
    echo    安装包：release\%SETUP_EXE%
    if exist "%OUT_DIR%\crabapple-md.exe" echo    便携版：release\crabapple-md.exe
    echo    已在资源管理器中定位安装包。
    explorer /select,"%~dp0%OUT_DIR%\%SETUP_EXE%"
) else (
    echo    安装包目录：%SETUP_DIR%
    start "" "%~dp0%SETUP_DIR%"
)
echo ==========================================
echo 按任意键关闭窗口……
pause >nul
exit /b 0

REM ============================================================
REM  子过程：检查命令是否可用
REM  参数：%1 = 命令名；返回 errorlevel 0=存在 1=不存在
REM ============================================================
:check_cmd
where %~1 >nul 2>nul
exit /b %errorlevel%

REM ============================================================
REM  子过程：通过 winget 静默安装软件包
REM  参数：%1 = winget 包 ID；返回安装命令的 errorlevel
REM ============================================================
:winget_install
where winget >nul 2>nul
if errorlevel 1 (
    echo [错误] 本机没有 winget 包管理器，无法自动安装 %~1
    exit /b 1
)
winget install --id %~1 -e --silent --accept-package-agreements --accept-source-agreements
exit /b %errorlevel%

REM ============================================================
REM  子过程：从注册表重新加载系统+用户 PATH〈安装新软件后使用〉
REM ============================================================
:refresh_path
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('PATH','Machine')+';'+[Environment]::GetEnvironmentVariable('PATH','User')"`) do set "PATH=%%P"
exit /b 0

REM ============================================================
REM  子过程：检查 MSVC 工具链〈link.exe〉是否真实存在
REM  遍历所有已注册的 VS 实例，任一实例含 link.exe 即视为可用
REM ============================================================
:check_msvc
set "MSVC_OK="
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" (
    for /f "usebackq delims=" %%I in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -all -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2^>nul`) do (
        if not defined MSVC_OK for /d %%V in ("%%~I\VC\Tools\MSVC\*") do (
            if exist "%%~V\bin\Hostx64\x64\link.exe" set "MSVC_OK=1"
        )
    )
)
if defined MSVC_OK exit /b 0
exit /b 1
