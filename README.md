# Office 365 Multi-Tenant Manager

> 基于 FastAPI + React 的现代化异步多租户 Microsoft 365/Office 365 管理系统

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-AGPL3.0-yellow.svg)](LICENSE)

---

## 📋 目录

- [技术架构](#技术架构)
- [功能特性](#功能特性)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [Azure AD 配置](#azure-ad-配置)
- [使用指南](#使用指南)
- [部署指南](#部署指南)
- [故障排除](#故障排除)
- [项目结构](#项目结构)

---

## 🏗️ 技术架构

### 后端技术栈
- **FastAPI** - 现代化异步 Python Web 框架
- **MSAL** - Microsoft Authentication Library
- **SQLAlchemy** - 异步 ORM
- **aiohttp** - 异步 HTTP 客户端
- **Pydantic** - 数据验证

### 前端技术栈
- **React 18** + **TypeScript** - UI 框架
- **Vite** - 快速构建工具
- **Tailwind CSS** - 现代化样式
- **shadcn/ui** - 高质量 UI 组件库
- **TanStack Query** - 数据管理
- **React Router** - 路由管理

---

## ✨ 功能特性

- ✅ **多租户管理** - 集中管理多个 Microsoft 365 租户
- ✅ **异步架构** - 基于 FastAPI 的高性能异步 API
- ✅ **用户管理** - 创建、删除、启用、禁用用户，支持批量操作
- ✅ **许可证管理** - 查看租户订阅和许可证使用情况，支持缓存和手动刷新
- ✅ **域名管理** - 添加、验证、删除自定义域名
- ✅ **角色管理** - 提升/撤销全局管理员权限
- ✅ **报告生成** - 生成 OneDrive 和 Exchange 使用报告
- ✅ **权限配置** - 一键配置应用 API 权限并生成管理员同意链接
- ✅ **密钥管理** - 自动更新客户端密钥，支持删除旧密钥
- ✅ **凭据验证** - 自动验证租户凭据和 SPO 可用性
- ✅ **现代化 UI** - 响应式设计，完美适配移动端，支持紧凑/完整视图切换
- ✅ **Graph API 集成** - 完整的 Microsoft Graph API 支持

---

## 📦 系统要求

### 软件要求
- **Python** 3.10 或更高版本
- **Node.js** 16.0 或更高版本
- **uv** - Python 包管理器（推荐）

### Azure AD 要求
- 已注册的 Azure AD 应用程序
- 已配置的应用程序权限（详见 [Azure AD 配置](#azure-ad-配置)）
- 管理员同意已授予

### 必需的 Graph API 权限

#### 核心权限（必需）
- `User.ReadWrite.All` - 用户管理
- `Directory.ReadWrite.All` - 目录管理
- `Organization.Read.All` - 组织信息
- `Reports.Read.All` - 报告生成

#### 高级功能权限（推荐）
- `RoleManagement.ReadWrite.Directory` - 角色管理
- `Domain.ReadWrite.All` - 域名管理
- `Application.ReadWrite.All` - 应用权限配置和密钥更新

#### 可选权限
- `Sites.FullControl.All` - SharePoint 在线状态检查

---

## 🚀 快速开始

### 方法 1: 一键启动（推荐）

**Windows:**
```bash
start_all.bat
```

**Linux/Mac:**
```bash
chmod +x start_all.sh
./start_all.sh
```

### 方法 2: 分步安装

#### 第 1 步: 安装 uv

```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Linux/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### 第 2 步: 克隆项目

```bash
git clone <repository-url>
cd o365-manager
```

#### 第 3 步: 安装后端依赖

```bash
# 使用 uv 安装依赖
uv sync

# 或使用 pip
pip install -e .
```

#### 第 4 步: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
```

#### 第 5 步: 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

#### 第 6 步: 启动服务

**启动后端:**
```bash
# 使用 uv
uv run python run.py

# 或直接使用
python run.py
```

**启动前端（新终端）:**
```bash
cd frontend
npm run dev
```

### 访问应用

- **前端界面**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

---

## 🔐 Azure AD 配置

### 步骤 1: 注册应用程序

1. 登录 [Azure Portal](https://portal.azure.com)
2. 前往 **[应用注册](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)**
3. 点击 **新注册**
4. 填写应用信息:
   - **名称**: Office 365 Manager
   - **支持的账户类型**: 仅此组织目录中的账户
   - **重定向 URI**: 留空
5. 点击 **注册**

### 步骤 2: 记录应用信息

记录以下信息（将在配置时使用）:
- **应用程序（客户端）ID**
- **目录（租户）ID**

### 步骤 3: 创建客户端密钥

1. 在应用程序页面，点击 **证书和密码**
2. 点击 **新客户端密码**
3. 填写描述，选择过期时间（建议 24 个月）
4. 点击 **添加**
5. **立即复制密钥值**（之后将无法再查看）

### 步骤 4: 配置 API 权限

#### 方法 1: 使用系统自动配置（推荐）⭐

1. 手动添加 `Application.ReadWrite.All` 权限（用于配置其他权限）
2. 授予管理员同意
3. 在系统中添加租户后，点击 **"配置权限"** 按钮
4. 系统将自动配置所需的所有权限
5. 点击生成的管理员同意链接完成授权

#### 方法 2: 手动配置

1. 在应用程序页面，点击 **API 权限**
2. 点击 **添加权限** > **Microsoft Graph**
3. 选择 **应用程序权限**（不是委托权限）
4. 添加以下权限:

**核心权限（必需）:**
- `User.ReadWrite.All` - 用户管理
- `Directory.ReadWrite.All` - 目录读写
- `Organization.Read.All` - 组织信息
- `Reports.Read.All` - 使用报告

**高级功能（推荐）:**
- `RoleManagement.ReadWrite.Directory` - 角色管理
- `Domain.ReadWrite.All` - 域名管理
- `Application.ReadWrite.All` - 应用配置和密钥管理

**可选功能:**
- `Sites.FullControl.All` - SharePoint 检查

### 步骤 5: 授予管理员同意

1. 在 **API 权限** 页面
2. 点击 **授予 [租户名称] 的管理员同意**
3. 确认授予同意
4. 确保所有权限状态显示绿色勾号

### 权限功能对照表

| 功能 | 所需权限 |
|------|---------|
| 用户管理（创建/删除/更新） | `User.ReadWrite.All`, `Directory.ReadWrite.All` |
| 启用/禁用用户 | `User.ReadWrite.All` |
| 角色管理（提权/撤权） | `RoleManagement.ReadWrite.Directory` |
| 域名管理 | `Domain.ReadWrite.All` |
| 查看许可证 | `Organization.Read.All` |
| 生成报告 | `Reports.Read.All` |

---

## 📖 使用指南

### 添加第一个租户

#### 通过前端界面

1. 打开 http://localhost:3000
2. 完成初始化设置（创建管理员账户）
3. 点击左侧菜单 **"租户管理"**
4. 点击 **"添加租户"** 按钮
5. 填写表单:
   - **租户 ID**: Azure AD 租户 ID
   - **客户端 ID**: 应用程序（客户端）ID
   - **客户端密钥**: 创建的客户端密钥值
   - **租户名称**: 自定义名称（可选）
   - **备注**: 备注信息（可选）
6. 点击 **"创建"**
7. 点击 **"验证凭据"** 确保配置正确
8. 点击 **"配置权限"** 自动配置 API 权限（如果还未配置）
9. 使用生成的管理员同意链接完成授权

### 租户管理功能

#### 凭据管理
- **验证凭据**: 测试租户凭据是否有效
- **更新密钥**: 自动生成新的客户端密钥（过期时间 2099-12-31）
- **删除旧密钥**: 更新密钥时可选择删除当前使用的旧密钥

#### 权限配置
- **配置权限**: 一键配置所需的 Microsoft Graph API 权限
- **自动生成同意链接**: 配置完成后自动生成管理员同意 URL
- 配置的权限包括：
  - `User.Read.All` - 读取所有用户
  - `Organization.Read.All` - 读取组织信息
  - `Reports.Read.All` - 读取使用报告
  - `Directory.Read.All` - 读取目录数据

#### SPO 状态检查
- **检查 SPO**: 验证 SharePoint Online 是否可用
- 显示 SPO 可用性状态

#### 视图模式
- **紧凑视图**: 单行显示租户信息，适合管理大量租户
- **完整视图**: 卡片式显示，信息更详细

---

## 🚢 部署指南

### Docker 部署

#### 使用 Docker

```bash
# 构建镜像
docker build -t o365-manager .

# 运行容器
docker run -d \
  -p 8000:8000 \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e SECRET_KEY=your-secret-key \
  --name o365-manager \
  o365-manager
```

#### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境部署

#### 使用 Nginx 反向代理

创建 Nginx 配置文件:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 使用 Systemd 服务

创建 `/etc/systemd/system/o365-manager.service`:

```ini
[Unit]
Description=Office 365 Multi-Tenant Manager
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/o365-manager
ExecStart=/usr/local/bin/uv run python run.py
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable o365-manager
sudo systemctl start o365-manager
```

#### 性能优化

使用多个 Worker 进程:

```bash
# 使用 uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# 或使用 gunicorn
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### 数据库备份

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/o365-manager"
DB_FILE="/path/to/o365_manager.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/o365_manager_$DATE.db"

# 保留最近 30 天的备份
find $BACKUP_DIR -name "o365_manager_*.db" -mtime +30 -delete
```

---

## 🔧 故障排除

### 常见问题

#### 1. 安装问题

**问题**: uv 命令未找到
```bash
# 重新安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 或使用 pip
pip install uv
```

**问题**: 依赖安装失败
```bash
# 清理缓存
uv cache clean

# 重新同步
uv sync
```

#### 2. 启动问题

**问题**: 端口 8000 被占用
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

**解决**: 修改 `.env` 中的 `API_PORT`

**问题**: 前端端口 3000 被占用

**解决**: 修改 `frontend/vite.config.ts` 中的端口

#### 3. API 请求问题

**问题**: "No tenant selected"

**解决**: 
1. 确保已添加租户
2. 选择一个租户（点击"选择"按钮）

**问题**: Token 获取失败

**解决**: 
1. 检查 Azure AD 应用配置
2. 确认客户端密钥未过期
3. 验证已授予管理员同意
4. 检查权限类型是"应用程序权限"

**问题**: 权限不足

**解决**: 
1. 在 Azure Portal 检查权限配置
2. 确保使用**应用程序权限**（不是委托权限）
3. 重新授予管理员同意

#### 4. 数据库问题

**问题**: 数据库锁定

```bash
# 检查是否有其他进程在使用
# Windows
handle o365_manager.db

# Linux
fuser o365_manager.db
```

**解决**: 关闭其他访问数据库的进程

---

## 📁 项目结构

```
o365-manager/
├── app/                          # 后端应用
│   ├── api/                      # API 路由
│   │   ├── tenants.py           # 租户管理
│   │   ├── o365_users.py        # 用户管理
│   │   ├── licenses.py          # 许可证
│   │   ├── domains.py           # 域名管理
│   │   ├── roles.py             # 角色管理
│   │   └── reports.py           # 报告
│   ├── services/                # 业务逻辑
│   │   ├── msal_service.py      # MSAL 认证
│   │   └── graph_service.py     # Graph API
│   ├── config.py                # 配置
│   ├── database.py              # 数据库
│   ├── models.py                # 数据模型
│   ├── schemas.py               # Pydantic 模型
│   └── main.py                  # 应用入口
├── frontend/                     # 前端应用
│   ├── src/
│   │   ├── components/          # 组件
│   │   ├── pages/               # 页面
│   │   ├── lib/                 # 工具库
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── examples/                     # 示例脚本
│   ├── example_usage.py
│   └── batch_create_users.py
├── pyproject.toml               # Python 项目配置
├── .env.example                 # 环境变量模板
├── run.py                       # 启动脚本
├── start_all.bat                # Windows 一键启动
├── start_all.sh                 # Linux/Mac 一键启动
├── Dockerfile                   # Docker 镜像
├── docker-compose.yml           # Docker Compose
└── README.md                    # 项目文档
```

---

## 🔒 安全最佳实践

1. **密钥管理**
   - 定期轮换客户端密钥（建议每 6-12 个月）
   - 不要在代码中硬编码密钥
   - 使用环境变量或密钥管理服务

2. **权限最小化**
   - 只申请必需的权限
   - 定期审查权限使用情况
   - 移除不再使用的权限

3. **访问控制**
   - 限制能访问应用配置的人员
   - 使用条件访问策略
   - 启用多因素认证（MFA）

4. **审计日志**
   - 启用 Azure AD 审计日志
   - 监控应用程序活动
   - 设置异常行为告警

5. **生产环境**
   - 使用强 `SECRET_KEY`
   - 启用 HTTPS
   - 配置防火墙
   - 定期备份数据库

---

## 📚 参考资料

- [Microsoft Graph API 文档](https://docs.microsoft.com/en-us/graph/overview)
- [MSAL Python 文档](https://github.com/AzureAD/microsoft-authentication-library-for-python)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 文档](https://react.dev/)
- [uv 文档](https://github.com/astral-sh/uv)
- [Azure AD 应用注册](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph 权限参考](https://docs.microsoft.com/graph/permissions-reference)

---

## 📄 许可证

AGPL3.0 License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系:

- 提交 [Issue](https://github.com/your-repo/issues)

## ⭐ Star History

如果这个项目对你有帮助，请给它一个 Star！⭐
