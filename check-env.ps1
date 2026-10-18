# crabapple-md Environment Check Script
# Author: xuechong 2026-06-17

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   crabapple-md Environment Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

Write-Host "[CHECK] Node.js..." -ForegroundColor Cyan
if (Get-Command "node" -ErrorAction SilentlyContinue) {
    $version = node --version
    Write-Host "  [OK] Installed: $version" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not installed" -ForegroundColor Red
    Write-Host "    Download: https://nodejs.org" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host "[CHECK] npm..." -ForegroundColor Cyan
if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    $version = npm --version
    Write-Host "  [OK] Installed: $version" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not installed" -ForegroundColor Red
    $allPassed = $false
}

Write-Host "[CHECK] pnpm..." -ForegroundColor Cyan
if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
    $version = pnpm --version
    Write-Host "  [OK] Installed: $version" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not installed" -ForegroundColor Red
    Write-Host "    Install: npm install -g pnpm" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host "[CHECK] Rust..." -ForegroundColor Cyan
if (Get-Command "rustc" -ErrorAction SilentlyContinue) {
    $version = rustc --version
    Write-Host "  [OK] Installed: $version" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not installed" -ForegroundColor Red
    Write-Host "    Download: https://rustup.rs" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host "[CHECK] Cargo..." -ForegroundColor Cyan
if (Get-Command "cargo" -ErrorAction SilentlyContinue) {
    $version = cargo --version
    Write-Host "  [OK] Installed: $version" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Not installed" -ForegroundColor Red
    $allPassed = $false
}

Write-Host "[CHECK] Visual Studio Build Tools..." -ForegroundColor Cyan
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vsWhere) {
    $installPath = & $vsWhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($installPath) {
        Write-Host "  [OK] Installed" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] C++ workload not installed" -ForegroundColor Red
        Write-Host "    Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
        $allPassed = $false
    }
} else {
    Write-Host "  [WARN] Cannot detect VS Installer" -ForegroundColor Yellow
    Write-Host "    Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "[OK] All checks passed!" -ForegroundColor Green
    Write-Host "  You can run build.bat to compile" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Some requirements not met" -ForegroundColor Red
    Write-Host "  Please install missing components first" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

pause
