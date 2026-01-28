from typing import Literal, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import generate_answer_and_keywords
from db import create_chat_graph, conn # db.py에서 함수와 conn 객체를 import 합니다.

app = FastAPI()

# CORS 설정
origins = [
    "http://localhost:3000",  # Next.js 개발 서버 주소
    "http://localhost:5173",  # Vite 개발 서버 주소 (legacy)
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


class GraphNode(BaseModel):
    id: str
    label: str
    type: Literal["question", "answer", "keyword"]


class GraphLink(BaseModel):
    source: str
    target: str


class GraphData(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]


class ChatResponse(BaseModel):
    status: Literal["success"]
    question: str
    answer: str
    keywords: List[str]
    graph: GraphData


@app.post("/api/chat")
async def chat_endpoint(chat_message: ChatMessage) -> ChatResponse:
    try:
        ai_result = generate_answer_and_keywords(chat_message.message)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI service error") from exc

    graph = create_chat_graph(
        question=chat_message.message,
        answer=ai_result.answer,
        keywords=ai_result.keywords,
    )

    return ChatResponse(
        status="success",
        question=chat_message.message,
        answer=ai_result.answer,
        keywords=ai_result.keywords,
        graph=graph,
    )

# 애플리케이션이 종료될 때 데이터베이스 연결을 닫도록 이벤트를 추가합니다.
@app.on_event("shutdown")
def shutdown_event():
    conn.close()
