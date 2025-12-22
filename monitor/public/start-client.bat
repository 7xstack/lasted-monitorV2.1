@echo off
cd /d "C:\Hospital\moniter"

echo [Server] Starting Build Process...
call npm run build

echo [Server] Starting Server...
call npm run start