import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import Candidate
from schemas import ChatRequest
from services.vector_store import search_candidate_cv
from agents.llm_client import get_llm_client

router = APIRouter()

@router.post("/candidate")
async def chat_candidate(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    RAG chat for a specific candidate.
    Uses Server-Sent Events (SSE) to stream the response.
    """
    if request.scope != "candidate":
        raise HTTPException(status_code=400, detail="Scope must be 'candidate'")
        
    candidate_id = request.reference_id
    
    # 1. Verify candidate exists
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # 2. Retrieve context from ChromaDB
    chunks = search_candidate_cv(candidate_id, request.message, top_k=3)
    context = "\n---\n".join(chunks) if chunks else "No specific context found in CV."
    
    # 3. Setup system prompt
    system_prompt = f"""You are a recruitment analysis assistant. 
You are answering questions about a candidate named {candidate.name}.
Answer ONLY based on the provided candidate documents. 
If information is not present in the documents, say so explicitly. 
Do not infer, estimate, or fabricate candidate attributes.
If they ask for general advice or something unrelated, politely steer them back to the candidate's profile."""

    # 4. Stream response
    llm = get_llm_client()
    
    async def event_generator():
        try:
            async for chunk in llm.stream_chat(
                system=system_prompt,
                message=request.message,
                context=context,
                temperature=0.3
            ):
                payload = json.dumps({"content": chunk})
                yield f"data: {payload}\n\n"
                
            yield "data: [DONE]\n\n"
        except Exception as e:
            payload = json.dumps({"error": str(e)})
            yield f"data: {payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/shortlist")
async def chat_shortlist(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Placeholder for cross-candidate RAG query (shortlist scope).
    """
    async def event_generator():
        yield f"data: {json.dumps({'content': 'Cross-candidate chat is not yet fully implemented in Phase 2 MVP.'})}\n\n"
        yield "data: [DONE]\n\n"
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")
