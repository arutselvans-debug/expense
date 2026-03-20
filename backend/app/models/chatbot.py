from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.rag_service import RAGService
from app.database.mongodb import get_db
from typing import List

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

class ChatQuery(BaseModel):
    user_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []

# Initialize your RAG service (embedding model, FAISS, Grok API key)
rag_service = RAGService()

@router.post("/query", response_model=ChatResponse)
async def chat_query(payload: ChatQuery):
    """
    Accepts user query → returns AI response using RAG
    """
    try:
        answer, sources = rag_service.answer_query(user_id=payload.user_id, query=payload.query)
        return ChatResponse(answer=answer, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))