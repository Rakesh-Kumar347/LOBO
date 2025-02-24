@echo off
title LOBO Backend Server
cls

echo [ℹ️] This script is designed for Windows only.

echo [🔧] Setting up the virtual environment...
if not exist "requirements.txt" (
    echo [❌] 'requirements.txt' not found.
    pause
    exit /b 1
)

python setup.py
if errorlevel 1 (
    echo [❌] Failed to set up the virtual environment.
    pause
    exit /b 1
)

echo [✅] Virtual environment is ready.

echo [🔄] Activating virtual environment...
if not exist "venv\Scripts\activate" (
    echo [❌] Virtual environment not found. Run setup.py first.
    pause
    exit /b 1
)
call venv\Scripts\activate

echo [🚀] Starting Flask backend...
python app.py
if errorlevel 1 (
    echo [❌] Failed to start the Flask backend.
    goto cleanup
)

@REM :cleanup
@REM echo [🛑] Stopping server and deactivating virtual environment...
@REM deactivate

@REM echo [❌] Server stopped. Press any key to exit...
@REM pause