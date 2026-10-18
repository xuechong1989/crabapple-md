param(
    [string]$Source = (Join-Path $PSScriptRoot '..\src-tauri\target\release\crabapple-md.exe'),
    [string]$Target = 'D:\zzzzzz\crabapple-md'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Source)) {
    throw "找不到可执行文件：$Source"
}

New-Item -ItemType Directory -Force -Path $Target | Out-Null
$dest = Join-Path $Target 'crabapple-md.exe'
Copy-Item $Source $dest -Force

Write-Host "已安装：$dest"
Write-Host "目标目录：$Target"
