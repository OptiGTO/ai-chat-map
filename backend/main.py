from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import create_chat_node, conn # db.py에서 함수와 conn 객체를 import 합니다.

app = FastAPI()

# CORS 설정
origins = [
    "http://localhost:5173",  # React 개발 서버 주소
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(chat_message: ChatMessage):
    # 이제 단순 echo가 아니라 데이터베이스에 노드를 생성합니다.
    create_chat_node(chat_message.message)
    
    # 클라이언트에게는 성공했다는 메시지를 돌려줍니다.
    return {"status": "success", "message_received": chat_message.message}

# 애플리케이션이 종료될 때 데이터베이스 연결을 닫도록 이벤트를 추가합니다.
@app.on_event("shutdown")
def shutdown_event():
    conn.close()