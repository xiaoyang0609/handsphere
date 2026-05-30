@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ╔══════════════════════════════════════════╗
echo ║      🚀 启动手势交互实验室                ║
echo ╚══════════════════════════════════════════╝
echo.

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 未检测到 Node.js！请先安装 https://nodejs.org
    echo.
    pause
    exit /b
)

:: 检查是否已占用端口
netstat -ano | findstr ":8080 " >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ⚠️  端口 8080 已被占用，尝试关闭旧进程...
    taskkill /f /fi "PID gt 0" /fi "IMAGENAME eq node.exe" 2>nul
    taskkill /f /im node.exe 2>nul
    timeout /t 2 /nobreak >nul
)

:: 启动 Node.js 服务器（新窗口）
start "Node Server HandSphere" /MIN cmd /c "node serve.js"
echo ✅ 服务器启动中...
timeout /t 2 /nobreak >nul

:: 获取本机IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do set IP=%%a
set IP=%IP: =%

echo.
echo ╔══════════════════════════════════════════╗
echo ║      📡 手机访问方式                      ║
echo ╚══════════════════════════════════════════╝
echo.
echo   📱 方式一：局域网（同一WiFi）：
echo      http://%IP%/ball.html
echo      http://%IP%/board.html
echo.
echo   🌐 方式二：内网穿透（手机用流量/远程）：
echo      检查 SSH 是否可用...
echo.

:: 检查 SSH 是否可用
where ssh >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   ✅ 检测到 SSH，正在建立公网隧道...
    echo   ⏳ 等待 localhost.run 连接...
    echo.
    start "SSH Tunnel localhost.run" cmd /c "ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run 2>&1 | findstr /i "lhr.life""
    echo   ⏎ 隧道建立后请查看新窗口中的地址
    echo.
) else (
    echo   ⚠️  未检测到 SSH 客户端
    echo      Windows 10/11 请安装 OpenSSH 客户端：
    echo      设置 → 应用 → 可选功能 → 添加 OpenSSH 客户端
    echo.
    echo      💡 或者直接在同一WiFi下用方式一访问
    echo.
)

echo   💻 电脑本地访问：
echo      http://localhost:8080
echo.
echo   ⏎ 按回车键关闭所有服务...
pause >nul

:: 关闭所有
taskkill /f /fi "WINDOWTITLE eq *Node Server HandSphere*" >nul 2>nul
taskkill /f /fi "WINDOWTITLE eq *SSH Tunnel*" >nul 2>nul
taskkill /f /im node.exe 2>nul
echo 服务已关闭。