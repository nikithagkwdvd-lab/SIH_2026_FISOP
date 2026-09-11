import os
import sys
from typing import Generator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

class Settings(BaseSettings):
    database_url: str = Field(
        ...,
        alias="DATABASE_URL",
        description="PostgreSQL connection URL in postgresql+psycopg:// format"
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

def get_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as e:
        sys.stderr.write(
            "\n========================================================================\n"
            "CRITICAL CONFIGURATION ERROR:\n"
            "DATABASE_URL environment variable is missing or invalid.\n"
            "Please copy backend/.env.example to backend/.env and provide a valid Supabase\n"
            "connection string, e.g.:\n"
            "DATABASE_URL=postgresql+psycopg://postgres:password@db.xxx.supabase.co:5432/postgres\n"
            "========================================================================\n\n"
        )
        raise RuntimeError("DATABASE_URL environment variable is required and must be a valid PostgreSQL connection string.") from e

def build_engine(url: str):
    """
    Creates a SQLAlchemy 2.x engine using psycopg3.
    Applies psycopg driver protocol if standard postgresql:// prefix is given.
    """
    if not url:
        raise ValueError("DATABASE_URL must be provided.")
    
    if url.startswith("sqlite"):
        return create_engine(url, echo=False, connect_args={"check_same_thread": False})
    
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    
    return create_engine(
        url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

# Attempt to initialize settings and engine at module load time if DATABASE_URL is present
settings: Settings | None = None
engine = None
SessionLocal = None

try:
    settings = get_settings()
    engine = build_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception:
    # Environment variable might be supplied later or in test runner
    pass

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency / general generator for database sessions.
    """
    if SessionLocal is None:
        # Re-try getting settings in case env was loaded after import
        current_settings = get_settings()
        local_engine = build_engine(current_settings.database_url)
        local_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=local_engine)
        session = local_session_factory()
    else:
        session = SessionLocal()
        
    try:
        yield session
    finally:
        session.close()
