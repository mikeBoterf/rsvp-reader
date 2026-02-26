@echo off
REM Build script for Python backend - creates standalone executable for Tauri
setlocal

echo ========================================
echo Building Python Backend for RSVP Reader
echo ========================================
echo.

REM Change to backend directory
cd /d "C:\projetcs\RSVP reader\backend"

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q

REM Build with PyInstaller
echo.
echo Building executable with PyInstaller...
pyinstaller python-backend.spec --distpath ../src-tauri/binaries --workpath ./build --clean -y

if errorlevel 1 (
    echo.
    echo PyInstaller build failed!
    deactivate
    exit /b 1
)

REM Rename to Tauri's expected platform-specific name
echo.
echo Renaming to Tauri platform convention...
cd /d "C:\projetcs\RSVP reader\src-tauri\binaries"

REM Delete old file if exists
if exist "python-backend-x86_64-pc-windows-msvc.exe" del "python-backend-x86_64-pc-windows-msvc.exe"

REM Rename new build
ren "python-backend.exe" "python-backend-x86_64-pc-windows-msvc.exe"

if errorlevel 1 (
    echo.
    echo Failed to rename executable!
    deactivate
    exit /b 1
)

echo.
echo ========================================
echo Python backend built successfully!
echo Location: src-tauri\binaries\python-backend-x86_64-pc-windows-msvc.exe
echo ========================================

deactivate
