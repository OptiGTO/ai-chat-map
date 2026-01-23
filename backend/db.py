from datetime import datetime
import os
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# docker-compose.yml 파일에 정의된 서비스 이름(neo4j)과 포트(7687)를 사용합니다.
# NEO4J_USER와 NEO4J_PASSWORD는 .env에서 불러옵니다.
URI = os.getenv("NEO4J_URI") or "bolt://localhost:7687"
USER = os.getenv("NEO4J_USER") or "neo4j"
PASSWORD = os.getenv("NEO4J_PASSWORD")

if not PASSWORD:
    raise RuntimeError("NEO4J_PASSWORD is not set. Add it to .env.")

class Neo4jConnection:
    def __init__(self, uri, user, password):
        # __driver는 클래스 내부에서만 사용됩니다.
        self.__driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        # 애플리케이션 종료 시 드라이버 연결을 닫습니다.
        if self.__driver is not None:
            self.__driver.close()

    def query(self, query, parameters=None, db=None):
        # 쿼리를 실행하는 공용 메서드입니다.
        assert self.__driver is not None, "Driver not initialized!"
        session = None
        response = None
        try:
            session = self.__driver.session(database=db) if db is not None else self.__driver.session()
            response = list(session.run(query, parameters))
        except Exception as e:
            print("Query failed:", e)
        finally:
            if session is not None:
                session.close()
        return response

# Neo4jConnection 클래스의 인스턴스를 생성합니다.
# 이 conn 객체를 다른 파일에서 import하여 사용할 것입니다.
conn = Neo4jConnection(URI, USER, PASSWORD)

def create_chat_node(message: str):
    """
    채팅 메시지를 받아 Neo4j에 'Chat' 노드를 생성합니다.
    """
    query = (
        "CREATE (c:Chat {message: $message, timestamp: $timestamp})"
    )
    print(f"✅ DB: 'create_chat_node' 함수가 메시지 '{message}'와 함께 호출되었습니다.")
    # Cypher 쿼리에 전달할 파라미터를 딕셔너리 형태로 구성합니다.
    parameters = {
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    conn.query(query, parameters)
