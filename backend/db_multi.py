import os
import backoff
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()  # .env → 환경변수 로드

# ── 데이터베이스 연결 문자열 ───────────────────────────────────────────
LOCAL_URL = "sqlite:///./devices.db"              # 로컬 SQLite 파일
CLOUD_URL = os.getenv("DB_URL")                   # RDS 또는 Aurora(MySQL) URL

# ── SQLAlchemy Engine / Session ───────────────────────────────────────
local_eng = create_engine(
    LOCAL_URL,
    connect_args={"check_same_thread": False},   # SQLite 다중 스레드 허용
)
cloud_eng = create_engine(
    CLOUD_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=10,
    max_overflow=20,
)

LocalSession = sessionmaker(bind=local_eng)
CloudSession = sessionmaker(bind=cloud_eng)

# ──────────────────────────────────────────────────────────────────────
#  public helpers
# ──────────────────────────────────────────────────────────────────────

def _exec(conn, sql: str, params: dict | tuple):
    """SQLAlchemy Connection 에서 단일 문 실행"""
    conn.execute(text(sql), params or {})


@backoff.on_exception(backoff.expo, SQLAlchemyError, max_time=60)
def dual_commit(
    sql: str,
    params: dict | tuple | None = None,
    *,
    skip_sqlite: bool = False,
    skip_cloud: bool = False,
):
    """SQLite(로컬) ↔ MySQL(RDS) **동시 쓰기** 헬퍼.

    Parameters
    ----------
    sql : str
        SQL 문.  ``:param`` 또는 ``?`` 플레이스홀더 아무거나 사용 가능.
    params : dict | tuple | None
        바인딩 값.  dict 권장.
    skip_sqlite : bool, default False
        ``True``  →  로컬 SQLite 실행을 건너뜀 (인덱스 중복 방지 등)
    skip_cloud  : bool, default False
        ``True``  →  RDS(MySQL) 실행을 건너뜀 (테스트용)
    """

    params = params or {}

    # 1) 로컬 SQLite ---------------------------------------------------
    if not skip_sqlite:
        with local_eng.begin() as conn:
            _exec(conn, sql, params)

    # 2) RDS / Aurora / MySQL -----------------------------------------
    if not skip_cloud:
        with cloud_eng.begin() as conn:
            _exec(conn, sql, params)
