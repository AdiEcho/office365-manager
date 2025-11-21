@echo off
echo ========================================
echo Office 365 Manager - 启动脚本
echo ========================================
echo.

echo [检查环境依赖...]
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [警告] 未检测到 Node.js!
    echo 正在尝试使用 winget 安装 Node.js...
    where winget >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo.
        echo winget 不可用，请手动安装 Node.js:
        echo 1. 访问 https://nodejs.org/ 下载并安装
        echo 2. 或者升级 Windows 10/11 以使用 winget
        echo.
        pause
        exit /b 1
    )
    winget install OpenJS.NodeJS.LTS
    if %ERRORLEVEL% neq 0 (
        echo Node.js 安装失败，请手动安装后重试
        pause
        exit /b 1
    )
    echo Node.js 安装成功，请重新运行此脚本
    pause
    exit /b 0
) else (
    echo [✓] Node.js 已安装
)

REM 检查 uv 是否安装
where uv >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [警告] 未检测到 uv!
    echo 正在安装 uv...
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    if %ERRORLEVEL% neq 0 (
        echo uv 安装失败!
        pause
        exit /b 1
    )
    echo uv 安装成功，请重新运行此脚本
    pause
    exit /b 0
) else (
    echo [✓] uv 已安装
)

echo.
echo [1/2] 构建前端...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 前端构建失败!
    pause
    exit /b 1
)
cd ..

echo [2/2] 启动应用服务器...
call "uv sync"
call "uv lock --upgrade"
start "O365 Manager" cmd /k "uv run run.py"

echo.
echo ========================================
echo 启动完成!
echo ========================================
echo 应用地址: http://localhost:8000
echo ========================================
echo.
echo 按任意键退出...
pause >nul
