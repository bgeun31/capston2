from sqlalchemy import text
from db_multi import CloudSession

with CloudSession() as ses:
    result = ses.execute(text("SELECT COUNT(*) AS cnt FROM device")).scalar()
    print(f"✅  RDS device 테이블 행 수: {result}")