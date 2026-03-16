import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db
from models.schemas import Candidate
from schemas import ChatRequest
from services.vector_store import search_candidate_cv, search_job_cvs
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
    result = await db.execute(
        select(Candidate)
        .where(Candidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # 2. Get Job Profile for context
    from models.schemas import JobProfile
    job_result = await db.execute(select(JobProfile).where(JobProfile.id == candidate.job_profile_id))
    job = job_result.scalar_one_or_none()
    
    job_info = "No job details available."
    if job:
        job_info = f"""
Job Title: {job.title}
Department: {job.department}
Description: {job.description[:500]}...
Mandatory Criteria: {json.dumps(job.mandatory_criteria)}
Preferred Criteria: {json.dumps(job.preferred_criteria)}
"""

    # 3. Get candidate's existing scoring results
    candidate_scores = f"""
Final Score: {candidate.final_score}/100
Status: {candidate.status}
AI Summary: {candidate.ai_summary}
Criterion Scores: {json.dumps(candidate.criterion_scores)}
Elimination Reason: {candidate.elimination_reason or "N/A"}
"""

    # 4. Retrieve RAG context from ChromaDB (raw CV text)
    chunks = search_candidate_cv(candidate_id, request.message, top_k=3)
    rag_context = "\n---\n".join(chunks) if chunks else "No specific context found in CV."
    
    # 5. Setup enriched system prompt
    system_prompt = f"""You are a recruitment analysis assistant. 
You are discussing a candidate named {candidate.name} for the position: {job.title if job else 'Unknown'}.

JOB REQUIREMENTS:
{job_info}

CANDIDATE SCORES & SUMMARY:
{candidate_scores}

INSTRUCTIONS:
1. Answer ONLY based on the provided candidate documents and the job requirements.
2. If asked why a candidate is fit or not fit, compare their profile and scores against the mandatory and preferred criteria listed above.
3. Be objective. Use the 'Criterion Scores' and 'AI Summary' as your primary evidence.
4. If information is missing from the CV, state that clearly.
5. If they ask for general advice, steer them back to this specific candidate's suitability for this specific job."""

    # 4. Call LLM and return full response as JSON
    llm = get_llm_client()
    content = await llm.chat(
        system=system_prompt,
        user_message=request.message,
        context=rag_context,
        temperature=0.3,
    )

    return {
        "id": f"msg-{uuid.uuid4()}",
        "role": "assistant",
        "content": content,
        "sources": ["CV text", "Scoring analysis"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/shortlist")
async def chat_shortlist(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Cross-candidate RAG query for shortlisted candidates.
    """
    if request.scope != "shortlist":
        raise HTTPException(status_code=400, detail="Scope must be 'shortlist'")
        
    job_id = request.reference_id
    
    # 1. Get Job Profile
    from models.schemas import JobProfile
    job_result = await db.execute(select(JobProfile).where(JobProfile.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job profile not found")

    # 2. Get Shortlisted Candidates
    cand_result = await db.execute(
        select(Candidate)
        .where(Candidate.job_profile_id == job_id)
        .where(Candidate.status == "shortlisted")
    )
    candidates = cand_result.scalars().all()
    if not candidates:
        return {
            "id": f"msg-{uuid.uuid4()}",
            "role": "assistant",
            "content": "No candidates are currently shortlisted for this job. Shortlist some candidates first to compare them.",
            "sources": [],
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

    candidate_map = {c.id: c.name for c in candidates}
    candidate_ids = list(candidate_map.keys())

    # 3. Retrieve RAG context from multiple CVs
    chunks = search_job_cvs(job_id, request.message, top_k=8, candidate_ids=candidate_ids)
    
    rag_context_list = []
    for chunk in chunks:
        name = candidate_map.get(chunk['candidate_id'], "Unknown")
        rag_context_list.append(f"CANDIDATE: {name}\nCONTENT: {chunk['content']}")
        
    rag_context = "\n---\n".join(rag_context_list) if rag_context_list else "No relevant information found across CVs."

    # 4. Summary of scoring for all shortlisted
    shortlist_summary = "\n".join([
        f"- {c.name}: Score {c.final_score}/100, Summary: {c.ai_summary}"
        for c in candidates
    ])

    system_prompt = f"""You are a recruitment head-hunter comparing shortlisted candidates for the {job.title} role.
    
JOB REQUIREMENTS:
{job.title} in {job.department}.

SHORTLISTED CANDIDATES OVERVIEW:
{shortlist_summary}

INSTRUCTIONS:
1. Compare candidates side-by-side based on the user's question.
2. Use the 'CANDIDATE:' tags in the RAG context to know which information belongs to whom.
3. Be strictly evidence-based. If one candidate has a specific skill mentioned and others don't, highlight that.
4. Keep the tone professional, sharp, and decisive."""

    # 5. Call LLM
    llm = get_llm_client()
    content = await llm.chat(
        system=system_prompt,
        user_message=request.message,
        context=rag_context,
        temperature=0.4,
    )

    return {
        "id": f"msg-{uuid.uuid4()}",
        "role": "assistant",
        "content": content,
        "sources": [f"CVs of {len(candidates)} shortlisted candidates"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
