from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cloud Postgres URL provided by Supabase
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:iYwUBqKh2Cp2BQr8@db.bfljxgsdyaidrvagdlfr.supabase.co:5432/postgres"

# Connect to Supabase
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
