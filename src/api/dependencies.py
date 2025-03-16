from sqlalchemy.orm import Session
from src.database.models import Base
from sqlalchemy import create_engine
from src.config import Config

# Veritabanı bağlantısı
engine = create_engine(Config.DATABASE_URL)
Base.metadata.create_all(bind=engine)

def get_db():
    """Veritabanı bağlantısı için dependency"""
    db = Session(engine)
    try:
        yield db
    finally:
        db.close() 