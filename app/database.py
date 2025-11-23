from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=True,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def run_migrations():
    """运行数据库迁移"""
    try:
        async with engine.begin() as conn:
            # 迁移1: 为 license_cache 表添加 expires_at 字段
            logger.info("Checking database migrations...")
            
            # SQLite 使用 PRAGMA table_info 来检查列是否存在
            check_column_query = text("PRAGMA table_info(license_cache)")
            result = await conn.execute(check_column_query)
            columns = result.fetchall()
            
            if columns:  # 表存在
                column_names = [col[1] for col in columns]
                
                if 'expires_at' not in column_names:
                    logger.info("Running migration: Adding expires_at column to license_cache table...")
                    alter_table_query = text("""
                        ALTER TABLE license_cache 
                        ADD COLUMN expires_at TIMESTAMP
                    """)
                    await conn.execute(alter_table_query)
                    logger.info("Migration completed: expires_at column added successfully")
                else:
                    logger.info("Migration check: expires_at column already exists")
            else:
                logger.info("license_cache table does not exist yet, will be created by init_db")
                
    except Exception as e:
        logger.error(f"Migration error: {str(e)}")
        # 不抛出异常，让应用继续启动


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 运行数据库迁移
    await run_migrations()
    
    # 检查是否已存在用户
    from app.models import User
    from sqlalchemy import select
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("Database initialized. Please register your first admin user.")
        else:
            print(f"Database initialized. Found {len(users)} user(s) in the system.")
