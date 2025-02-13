@echo off
echo Starting server...
set PATH=%PATH%;C:\Program Files\nodejs
cd /d %~dp0
call npm init -y
call npm install express
node app.js
