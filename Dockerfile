FROM node:24-alpine AS frontend-builder

WORKDIR /frontend

# 更精准缓存：只 copy package.json 和 package-lock.json
COPY frontend/package*.json ./
RUN npm ci --omit=dev

COPY frontend/ ./
RUN npm run build


# Python后端阶段
FROM astral/uv:python3.12-bookworm-slim

WORKDIR /app

# 只拷贝依赖定义文件，而不是整个源码
COPY pyproject.toml uv.lock ./

# 安装 prod 依赖（不构建 venv，会自动放入系统 python）
RUN uv sync --no-dev


# ----------------------------
# 最终运行阶段（最小镜像）
# ----------------------------
FROM python:3.12-slim

WORKDIR /app

# 拷贝依赖
COPY --from=backend-base /usr/local /usr/local

# 拷贝应用代码
COPY app/ ./app/
COPY run.py ./

# 拷贝前端构建产物
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 8000

ENV DATABASE_URL=sqlite+aiosqlite:///./data/o365_manager.db

CMD ["uv", "run", "python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
