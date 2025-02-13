@echo off
echo Installing Node.js...
msiexec /i node_setup.msi /qn
echo Installation completed
echo Please wait for 10 seconds...
timeout /t 10
echo Testing Node.js installation...
set "PATH=%PATH%;C:\Program Files\nodejs"
node -v
if %ERRORLEVEL% NEQ 0 (
    echo Installation failed. Please restart your computer and try again.
) else (
    echo Node.js installed successfully!
)
