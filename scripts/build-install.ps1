param(
    [string]$Target = 'D:\zzzzzz\crabapple-md'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    pnpm install --frozen-lockfile
    pnpm tauri build

    $exe = Join-Path $root 'src-tauri\target\release\crabapple-md.exe'
    & (Join-Path $PSScriptRoot 'install-local.ps1') -Source $exe -Target $Target

    $installer = Get-ChildItem (Join-Path $root 'src-tauri\target\release\bundle\nsis') -Filter '*.exe' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($installer) {
        Copy-Item $installer.FullName (Join-Path $Target $installer.Name) -Force
        Write-Host "已复制安装包：$(Join-Path $Target $installer.Name)"
    }
}
finally {
    Pop-Location
}
