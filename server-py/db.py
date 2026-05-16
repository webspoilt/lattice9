import asyncpg
import logging

logger = logging.getLogger("lattice9-graph-engine")

_pg_pool = None

async def get_pg_pool():
    global _pg_pool
    from config import DATABASE_URL
    if _pg_pool is None and DATABASE_URL:
        _pg_pool = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=8)
    return _pg_pool

async def close_pg_pool():
    global _pg_pool
    if _pg_pool:
        await _pg_pool.close()
        _pg_pool = None
