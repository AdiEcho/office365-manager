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
- [API 端点](#api-端点)
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
- ✅ **许可证管理** - 查看租户订阅和许可证使用情况
- ✅ **域名管理** - 添加、验证、删除自定义域名
- ✅ **角色管理** - 提升/撤销全局管理员权限
- ✅ **报告生成** - 生成 OneDrive 和 Exchange 使用报告
- ✅ **现代化 UI** - 响应式设计，完美适配移动端
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
- `User.ReadWrite.All` - 用户管理
- `Directory.ReadWrite.All` - 目录管理
- `RoleManagement.ReadWrite.Directory` - 角色管理
- `Domain.ReadWrite.All` - 域名管理
- `Reports.Read.All` - 报告生成
- `Organization.Read.All` - 组织信息

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
2. 导航到 **Azure Active Directory** > **应用注册**
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

1. 在应用程序页面，点击 **API 权限**
2. 点击 **添加权限** > **Microsoft Graph**
3. 选择 **应用程序权限**（不是委托权限）
4. 添加以下权限:

#### 用户管理
- `User.ReadWrite.All`
- `User.ManageIdentities.All`

#### 目录和角色管理
- `Directory.ReadWrite.All`
- `RoleManagement.ReadWrite.Directory`

#### 域名管理
- `Domain.ReadWrite.All`

#### 报告和组织
- `Reports.Read.All`
- `Organization.Read.All`

#### 可选权限
- `Application.ReadWrite.All` - 更新应用密钥
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

### 1. 添加第一个租户

#### 通过前端界面

1. 打开 http://localhost:3000
2. 点击左侧菜单 **"租户管理"**
3. 点击 **"添加租户"** 按钮
4. 填写表单:
   - **租户 ID**: Azure AD 租户 ID
   - **客户端 ID**: 应用程序（客户端）ID
   - **客户端密钥**: 创建的客户端密钥值
   - **租户名称**: 自定义名称（可选）
   - **备注**: 备注信息（可选）
5. 点击 **"创建"**

#### 通过 API

```bash
curl -X POST "http://localhost:8000/api/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant-id",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "tenant_name": "我的组织",
    "remarks": "生产环境"
  }'
```

### 2. 选择租户

所有操作都针对当前选中的租户：

1. 在租户列表中找到租户
2. 点击 **"选择"** 按钮
3. 租户卡片会高亮显示

### 3. 验证租户凭据

```bash
curl "http://localhost:8000/api/tenants/1/validate"
```

### 4. 创建用户

#### 单个用户

```bash
curl -X POST "http://localhost:8000/api/o365/users" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "张三",
    "user_principal_name": "zhangsan@yourdomain.com",
    "mail_nickname": "zhangsan",
    "password": "SecurePass123!",
    "usage_location": "CN"
  }'
```

#### 批量创建用户

```bash
curl -X POST "http://localhost:8000/api/o365/users/batch" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "display_name": "李四",
      "user_principal_name": "lisi@yourdomain.com",
      "mail_nickname": "lisi",
      "password": "SecurePass123!",
      "usage_location": "CN"
    },
    {
      "display_name": "王五",
      "user_principal_name": "wangwu@yourdomain.com",
      "mail_nickname": "wangwu",
      "password": "SecurePass123!",
      "usage_location": "CN"
    }
  ]'
```

### 5. 管理用户

#### 启用/禁用用户

```bash
# 禁用用户
curl -X POST "http://localhost:8000/api/o365/users/{user_id}/disable"

# 启用用户
curl -X POST "http://localhost:8000/api/o365/users/{user_id}/enable"
```

#### 搜索用户

```bash
curl "http://localhost:8000/api/o365/users/search?keyword=zhang"
```

### 6. 查看许可证

```bash
curl "http://localhost:8000/api/o365/licenses"
```

### 7. 管理域名

```bash
# 添加域名
curl -X POST "http://localhost:8000/api/o365/domains?domain_name=example.com"

# 验证域名
curl -X POST "http://localhost:8000/api/o365/domains/example.com/verify"

# 列出域名
curl "http://localhost:8000/api/o365/domains"
```

### 8. 角色管理

```bash
# 提升为全局管理员
curl -X POST "http://localhost:8000/api/o365/roles/{user_id}/promote"

# 撤销全局管理员
curl -X POST "http://localhost:8000/api/o365/roles/{user_id}/demote"
```

### 9. 生成报告

```bash
# OneDrive 使用报告
curl "http://localhost:8000/api/o365/reports/onedrive?period=D7" \
  --output onedrive_report.csv

# Exchange 使用报告
curl "http://localhost:8000/api/o365/reports/exchange?period=D7" \
  --output exchange_report.csv
```

---

## 🔌 API 端点

### 租户管理 `/api/tenants`

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/tenants` | 列出所有租户 |
| POST | `/api/tenants` | 添加新租户 |
| GET | `/api/tenants/{id}` | 获取租户详情 |
| PUT | `/api/tenants/{id}` | 更新租户 |
| DELETE | `/api/tenants/{id}` | 删除租户 |
| POST | `/api/tenants/{id}/select` | 选择当前租户 |
| GET | `/api/tenants/{id}/validate` | 验证租户凭据 |
| GET | `/api/tenants/selected/current` | 获取当前选中的租户 |

### O365 用户管理 `/api/o365/users`

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/o365/users` | 列出用户 |
| GET | `/api/o365/users/search?keyword=xxx` | 搜索用户 |
| GET | `/api/o365/users/{id}` | 获取用户详情 |
| POST | `/api/o365/users` | 创建用户 |
| POST | `/api/o365/users/batch` | 批量创建用户 |
| PATCH | `/api/o365/users/{id}` | 更新用户 |
| DELETE | `/api/o365/users/{id}` | 删除用户 |
| POST | `/api/o365/users/{id}/enable` | 启用用户 |
| POST | `/api/o365/users/{id}/disable` | 禁用用户 |

### 许可证 `/api/o365/licenses`

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/o365/licenses` | 查看所有许可证 |

### 域名管理 `/api/o365/domains`

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/o365/domains` | 列出所有域名 |
| GET | `/api/o365/domains/{id}` | 获取域名详情 |
| POST | `/api/o365/domains?domain_name=xxx` | 添加域名 |
| POST | `/api/o365/domains/{id}/verify` | 验证域名 |
| DELETE | `/api/o365/domains/{id}` | 删除域名 |

### 角色管理 `/api/o365/roles`

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/o365/roles` | 列出所有目录角色 |
| GET | `/api/o365/roles/{id}/members` | 查看角色成员 |
| POST | `/api/o365/roles/assign` | 分配角色 |
| POST | `/api/o365/roles/revoke` | 撤销角色 |
| POST | `/api/o365/roles/{user_id}/promote` | 提升为全局管理员 |
| POST | `/api/o365/roles/{user_id}/demote` | 撤销全局管理员 |

### 报告 `/api/o365/reports`

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/o365/reports/organization` | 组织信息 |
| GET | `/api/o365/reports/onedrive?period=D7` | OneDrive 使用报告 |
| GET | `/api/o365/reports/exchange?period=D7` | Exchange 使用报告 |

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

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系:

- 提交 [Issue](https://github.com/your-repo/issues)
- 发送邮件至: your-email@example.com

---

**开发完成**: 2025-11-19  
**版本**: v1.0.0  
**作者**: Droid AI Assistant

---

## ⭐ Star History

如果这个项目对你有帮助，请给它一个 Star！⭐
