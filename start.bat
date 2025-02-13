@echo off
echo 正在启动服务器...
set PATH=%PATH%;C:\Program Files\nodejs
cd /d %~dp0
"C:\Program Files\nodejs\node.exe" app.js
