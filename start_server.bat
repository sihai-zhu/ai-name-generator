@echo off
echo Checking Node.js installation...
where node > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found in PATH
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    ) else (
        echo Node.js installation not found!
        exit /b 1
    )
)

echo Starting Node.js server...
cd /d %~dp0
node app.js
