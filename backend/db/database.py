from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cloud Postgres URL provided by Supabase (IPv4 Connection Pooler for Render compatibility)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres.bfljxgsdyaidrvagdlfr:iYwUBqKh2Cp2BQr8@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

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
