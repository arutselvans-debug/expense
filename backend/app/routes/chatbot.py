from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.rag_service import RAGService
from typing import List
from app.utils.helpers import get_current_user

router = APIRouter(tags=["Chatbot"])

class ChatQuery(BaseModel):
    user_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []

# Initialize your RAG service (embedding model, FAISS, Grok API key)
rag_service = RAGService()

@router.post("/query", response_model=ChatResponse)
async def chat_query(payload: ChatQuery, current_user: dict = Depends(get_current_user)):
    """
    Accepts user query → returns AI response using RAG.
    Requires a valid JWT.
    """
    try:
        answer, sources = rag_service.answer_query(user_id=current_user["email"], query=payload.query)
        return ChatResponse(answer=answer, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))