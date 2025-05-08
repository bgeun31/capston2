# db_multi.py  ─── 새 파일
import os, backoff
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()                          # .env → 환경변수 로드

LOCAL_URL  = "sqlite:///./device.db"   # 기존 파일
CLOUD_URL  = os.getenv("DB_URL")       # RDS 연결 문자열

local_eng  = create_engine(LOCAL_URL, connect_args={"check_same_thread": False})
cloud_eng  = create_engine(CLOUD_URL,  pool_pre_ping=True, pool_recycle=1800)

LocalSession  = sessionmaker(bind=local_eng)
CloudSession  = sessionmaker(bind=cloud_eng)

@backoff.on_exception(backoff.expo, SQLAlchemyError, max_time=60)
def dual_commit(sql: str, params: dict | tuple = ()):
    """
    INSERT/UPDATE/DELETE 를 SQLite → RDS 두 곳에 동시에 실행
    • sql:  ':param' 또는 ? 플레이스홀더 모두 가능
    • params: dict(권장)  or  tuple
    """
    for eng in (local_eng, cloud_eng):
        with eng.begin() as conn:
            conn.execute(text(sql), params)
