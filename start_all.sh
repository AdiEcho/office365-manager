#!/bin/bash

echo "========================================"
echo "Office 365 Manager - 启动脚本"
echo "========================================"
echo ""

echo "[检查环境依赖...]"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[警告] 未检测到 Node.js!"
    echo "请选择安装方式:"
    echo "1. 使用包管理器安装 (推荐)"
    echo "   Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "   CentOS/RHEL:   sudo yum install nodejs npm"
    echo "   macOS:         brew install node"
    echo "2. 使用 nvm 安装: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo ""
    read -p "是否尝试自动安装? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                echo "使用 Homebrew 安装 Node.js..."
                brew install node
            else
                echo "未检测到 Homebrew，请先安装 Homebrew 或手动安装 Node.js"
                exit 1
            fi
        elif [[ -f /etc/debian_version ]]; then
            # Debian/Ubuntu
            echo "使用 apt-get 安装 Node.js..."
            sudo apt-get update
            sudo apt-get install -y nodejs npm
        elif [[ -f /etc/redhat-release ]]; then
            # CentOS/RHEL
            echo "使用 yum 安装 Node.js..."
            sudo yum install -y nodejs npm
        else
            echo "无法识别的操作系统，请手动安装 Node.js"
            exit 1
        fi
        
        if [ $? -ne 0 ]; then
            echo "Node.js 安装失败，请手动安装后重试"
            exit 1
        fi
        echo "Node.js 安装成功，请重新运行此脚本"
        exit 0
    else
        echo "请手动安装 Node.js 后重新运行此脚本"
        exit 1
    fi
else
    echo "[✓] Node.js 已安装 (版本: $(node --version))"
fi

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "[警告] 未检测到 uv!"
    echo "正在安装 uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    if [ $? -ne 0 ]; then
        echo "uv 安装失败!"
        exit 1
    fi
    # 加载 uv 到当前 shell
    export PATH="$HOME/.local/bin:$PATH"
    echo "uv 安装成功，请重新运行此脚本或执行: source ~/.bashrc"
    exit 0
else
    echo "[✓] uv 已安装 (版本: $(uv --version))"
fi

echo ""
echo "[1/2] 构建前端..."
cd frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "前端构建失败!"
    exit 1
fi
cd ..

echo "[2/2] 启动应用服务器..."
uv sync
uv lock --upgrade
uv run run.py &
APP_PID=$!

echo ""
echo "========================================"
echo "启动完成!"
echo "========================================"
echo "应用地址: http://localhost:8000"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止服务..."

# Trap Ctrl+C to kill the process
trap "kill $APP_PID; exit" INT

wait
