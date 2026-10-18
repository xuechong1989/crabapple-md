@echo off
title crabapple-md - Build Script

echo.
echo ========================================
echo    crabapple-md Build Script
echo ========================================
echo.
echo Please select an option:
echo.
echo   1. Build and Run (Recommended)
echo   2. Build Only
echo   3. Dev Mode (Hot Reload)
echo   4. Check Environment
echo   5. Exit
echo.

set /p choice="Enter option (1-5): "

if "%choice%"=="1" (
    echo.
    echo Building and running...
    powershell -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1"
) else if "%choice%"=="2" (
    echo.
    echo Building only...
    powershell -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1" -Build
) else if "%choice%"=="3" (
    echo.
    echo Starting dev mode...
    powershell -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1" -Dev
) else if "%choice%"=="4" (
    echo.
    echo Checking environment...
    powershell -ExecutionPolicy Bypass -File "%~dp0check-env.ps1"
) else if "%choice%"=="5" (
    exit /b 0
) else (
    echo.
    echo Invalid option!
    pause
    exit /b 1
)

pause
