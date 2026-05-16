import os
import logging

logger = logging.getLogger("lattice9-graph-engine")

DATABASE_URL = os.getenv("DATABASE_URL")
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
REDIS_URL = os.getenv("REDIS_URL")
LATTICE9_ENGINE_KEY = os.getenv("LATTICE9_ENGINE_KEY")
ENGINE_VERSION = "5.1.0"

REQUIRED_ENV = {
    "DATABASE_URL": DATABASE_URL,
    "NEO4J_URI": NEO4J_URI,
    "NEO4J_USER": NEO4J_USER,
    "NEO4J_PASSWORD": NEO4J_PASSWORD,
    "LATTICE9_ENGINE_KEY": LATTICE9_ENGINE_KEY,
}

missing = [k for k, v in REQUIRED_ENV.items() if not v]
if missing:
    logger.warning(f"Missing required env vars: {', '.join(missing)}")
