@echo off
chcp 65001 >nul
cd /d "C:\Users\52923\Desktop\HandSphere"

echo ╔════════════════════════════════════════╗
echo ║      🚀 启动手势交互实验室              ║
echo ╚════════════════════════════════════════╝
echo.

:: Kill old processes
taskkill /f /fi "WINDOWTITLE eq Python*http*HandSphere" >nul 2>nul
taskkill /f /fi "WINDOWTITLE eq *localhost.run*" >nul 2>nul
timeout /t 1 /nobreak >nul

:: Start HTTP server
start "Python HTTP HandSphere" python -m http.server 8080
echo ✅ 本地服务器已启动 (http://localhost:8080)
timeout /t 2 /nobreak >nul

:: Start SSH tunnel and capture URL
echo ⏳ 正在建立公网隧道...
for /f "tokens=*" %%a in ('ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run 2^>^&1 ^| findstr "lhr.life"') do set TUNNEL_URL=%%a
echo.
echo ╔════════════════════════════════════════╗
echo ║    📡 分享给任何人（公网访问）           ║
echo ║                                        ║
echo ║    %TUNNEL_URL%        ║
echo ║                                        ║
echo ║    💡 把上面的链接发给你的朋友           ║
echo ║    手机电脑都能打开，支持摄像头！        ║
echo ╚════════════════════════════════════════╝
echo.
echo   🔒 本地: http://localhost:8080
echo   📱 手机: https://192.168.137.1:8080
echo.
echo   ⏎ 按回车键关闭所有服务...
pause >nul

:: Cleanup on exit
taskkill /f /fi "WINDOWTITLE eq Python*http*HandSphere" >nul 2>nul
taskkill /f /fi "WINDOWTITLE eq *localhost.run*" >nul 2>nul
echo 服务已关闭。
