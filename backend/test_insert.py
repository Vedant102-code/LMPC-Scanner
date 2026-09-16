from db.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text("INSERT INTO inspections (inspection_id) VALUES ('TEST-SQL')"))
        conn.commit()
        print('Inserted successfully')
    except Exception as e:
        print('Error:', e)
