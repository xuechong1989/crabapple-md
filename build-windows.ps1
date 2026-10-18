# Quillium Windows Build Script
# Author: xuechong 2026-06-17

param(
    [switch]$Dev,
    [switch]$Build,
    [switch]$SkipCheck
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Quillium Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipCheck) {
    Write-Info "Checking environment..."

    if (Test-Command "node") {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } else {
        Write-Err "Node.js not found!"
        Write-Info "Download: https://nodejs.org"
        exit 1
    }

    if (Test-Command "pnpm") {
        $pnpmVersion = pnpm --version
        Write-Success "pnpm: $pnpmVersion"
    } else {
        Write-Warn "pnpm not found, installing..."
        npm install -g pnpm
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to install pnpm!"
            exit 1
        }
        Write-Success "pnpm installed"
    }

    if (Test-Command "rustc") {
        $rustVersion = rustc --version
        Write-Success "Rust: $rustVersion"
    } else {
        Write-Err "Rust not found!"
        Write-Host ""
        Write-Host "Please install Rust first:" -ForegroundColor Yellow
        Write-Host "  1. Download from: https://rustup.rs" -ForegroundColor Yellow
        Write-Host "  2. Run rustup-init.exe" -ForegroundColor Yellow
        Write-Host "  3. Restart this script after installation" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }

    if (Test-Command "cargo") {
        $cargoVersion = cargo --version
        Write-Success "Cargo: $cargoVersion"
    } else {
        Write-Err "Cargo not found!"
        exit 1
    }

    Write-Host ""
    Write-Success "Environment check passed!"
    Write-Host ""
}

Write-Info "Installing dependencies..."

if (Test-Path "node_modules") {
    Write-Info "node_modules found, skipping install"
} else {
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to install dependencies!"
        Write-Info "Trying to clear cache and retry..."
        pnpm store prune
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Still failed! Check your network connection"
            exit 1
        }
    }
    Write-Success "Dependencies installed"
}

Write-Host ""

if ($Dev) {
    Write-Info "Starting dev mode..."
    Write-Info "First build may take 5-10 minutes..."
    Write-Host ""
    pnpm tauri dev
} elseif ($Build) {
    Write-Info "Building release version..."
    Write-Info "First build may take 10-15 minutes..."
    Write-Host ""
    pnpm tauri build

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Build completed!"
        Write-Host ""
        Write-Info "Executable:"
        Write-Host "  src-tauri\target\release\Quillium.exe" -ForegroundColor Yellow
        Write-Host ""

        $run = Read-Host "Run the program now? (Y/N)"
        if ($run -eq "Y" -or $run -eq "y") {
            Start-Process "src-tauri\target\release\Quillium.exe"
        }
    } else {
        Write-Err "Build failed!"
        exit 1
    }
} else {
    Write-Info "Building..."
    Write-Info "First build may take 10-15 minutes..."
    Write-Host ""
    pnpm tauri build

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Build completed! Starting program..."
        Write-Host ""
        Start-Process "src-tauri\target\release\Quillium.exe"
    } else {
        Write-Err "Build failed!"
        exit 1
    }
}

Write-Host ""
Write-Success "Done!"
