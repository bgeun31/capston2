from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ✅ RDS 연결 정보
DB_URL = "mysql+pymysql://admin:capstondesign@database-1.cxq82a6mk833.ap-northeast-2.rds.amazonaws.com:3306/capston"

engine = create_engine(DB_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
