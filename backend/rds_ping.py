from sqlalchemy import text
from db_multi import dual_commit, CloudSession
dual_commit("INSERT INTO test_sync(msg) VALUES(:m)", {"m": "hello"})

with CloudSession() as ses:
    print(ses.execute(text("SELECT COUNT(*) FROM test_sync")).scalar())
    print(f"✅  RDS device 테이블 행 수: {result}")