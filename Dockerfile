# 前端构建阶段
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Python后端阶段
FROM astral/uv:python3.12-bookworm-slim

WORKDIR /app

# 复制依赖文件
COPY pyproject.toml ./

# 使用uv安装依赖
RUN uv sync --no-dev

# 复制应用代码
COPY app/ ./app/
COPY run.py ./

# 复制前端构建产物
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 8000

ENV DATABASE_URL=sqlite+aiosqlite:///./data/o365_manager.db

CMD ["uv", "run", "python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
