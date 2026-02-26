@echo off
REM Build script for RSVP Reader - properly sets up MSVC + Rust environment
setlocal

REM Set Cargo/Rust path explicitly
set "PATH=C:\Users\Andrew\.cargo\bin;%PATH%"

REM Activate Visual Studio environment
echo Setting up Visual Studio environment...
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

REM Verify tools are available
echo.
echo Verifying build tools...
where cargo >nul 2>&1
if errorlevel 1 (
    echo ERROR: cargo not found in PATH
    exit /b 1
)
where cl >nul 2>&1
if errorlevel 1 (
    echo ERROR: cl.exe not found in PATH
    exit /b 1
)
echo   cargo: OK
echo   cl.exe: OK

REM Change to project directory
cd /d "C:\projetcs\RSVP reader"

REM Build Python backend first
echo.
echo Building Python backend...
echo.
call build_backend.bat
if errorlevel 1 (
    echo.
    echo Python backend build failed!
    pause
    exit /b 1
)

REM Run the Tauri build
echo.
echo Building RSVP Reader with Tauri...
echo.
npm run tauri build

if errorlevel 1 (
    echo.
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build complete!
echo.
echo Installer location:
echo   src-tauri\target\release\bundle\nsis\
echo ========================================
pause
