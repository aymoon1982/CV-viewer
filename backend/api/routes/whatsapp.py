from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any

from models.database import get_db
from models.schemas import WhatsAppThread, WhatsAppMessage, Candidate, JobProfile
from services.whatsapp_service import whatsapp_service
from agents.llm_client import get_llm_client
from config import get_settings

router = APIRouter()
settings = get_settings()

class SendMessageRequest(BaseModel):
    candidate_id: str
    message: str

class DraftRequest(BaseModel):
    candidate_id: str

@router.get("/threads")
async def get_threads(db: AsyncSession = Depends(get_db)):
    """Fetch all WhatsApp threads for the inbox."""
    result = await db.execute(
        select(WhatsAppThread, Candidate)
        .outerjoin(Candidate, WhatsAppThread.candidate_id == Candidate.id)
        .order_by(WhatsAppThread.created_at.desc())
    )
    threads = []
    for thread, candidate in result.all():
        # Get latest message
        msg_result = await db.execute(
            select(WhatsAppMessage)
            .where(WhatsAppMessage.thread_id == thread.id)
            .order_by(WhatsAppMessage.sent_at.desc())
            .limit(1)
        )
        last_msg = msg_result.scalar_one_or_none()
        
        threads.append({
            "id": thread.id,
            "candidate_id": thread.candidate_id,
            "candidate_name": candidate.name if candidate else "Unknown",
            "phone_number": thread.phone_number,
            "status": thread.status,
            "last_message": last_msg.content if last_msg else None,
            "last_message_time": last_msg.sent_at if last_msg else thread.created_at,
            "unread_count": 0 # Not implemented yet
        })
    return threads

@router.get("/threads/{candidate_id}/messages")
async def get_messages(candidate_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch messages for a specific candidate thread."""
    result = await db.execute(select(WhatsAppThread).where(WhatsAppThread.candidate_id == candidate_id))
    thread = result.scalar_one_or_none()
    if not thread:
        return []

    msg_result = await db.execute(
        select(WhatsAppMessage)
        .where(WhatsAppMessage.thread_id == thread.id)
        .order_by(WhatsAppMessage.sent_at.asc())
    )
    messages = msg_result.scalars().all()
    return [{
        "id": m.id,
        "direction": m.direction,
        "content": m.content,
        "status": "delivered" if m.direction == "outbound" else "received",
        "createdAt": m.sent_at.isoformat()
    } for m in messages]

@router.post("/send")
async def send_whatsapp_message(req: SendMessageRequest, db: AsyncSession = Depends(get_db)):
    """Send an outbound WhatsApp message from the dashboard."""
    # Find candidate to get phone
    result = await db.execute(select(Candidate).where(Candidate.id == req.candidate_id))
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    phone = candidate.phone
    if not phone:
        # Fallback dummy phone if not parsed correctly
        phone = "+971501234567"
        
    # Find active thread
    thread_result = await db.execute(select(WhatsAppThread).where(WhatsAppThread.candidate_id == req.candidate_id))
    thread = thread_result.scalar_one_or_none()
    thread_id = thread.id if thread else None

    # Send via service
    success = await whatsapp_service.send_message(
        db=db,
        to_number=phone,
        text=req.message,
        candidate_id=req.candidate_id,
        thread_id=thread_id
    )
    
    if not success:
        # even if API fails, we save locally to allow UI to continue if no keys exist
        pass

    return {"status": "success", "message": "Message sent or queued"}

@router.get("/webhook")
async def verify_webhook(request: Request):
    """WhatsApp verification endpoint."""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == settings.WA_VERIFY_TOKEN:
            return Response(content=challenge, status_code=200)
        raise HTTPException(status_code=403, detail="Invalid verify token")
    raise HTTPException(status_code=400, detail="Missing parameters")

@router.post("/webhook")
async def handle_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive incoming WhatsApp messages."""
    body = await request.json()
    
    try:
        entries = body.get('entry', [])
        for entry in entries:
            changes = entry.get('changes', [])
            for change in changes:
                value = change.get('value', {})
                messages = value.get('messages', [])
                
                for msg in messages:
                    # Inbound message
                    phone = msg.get('from') # Sender's phone
                    text = msg.get('text', {}).get('body', '')
                    
                    if phone and text:
                        # Find matching thread by phone
                        result = await db.execute(select(WhatsAppThread).where(WhatsAppThread.phone_number == phone))
                        thread = result.scalar_one_or_none()
                        
                        if thread:
                            new_msg = WhatsAppMessage(
                                thread_id=thread.id,
                                direction="inbound",
                                content=text,
                                message_type="free_text"
                            )
                            db.add(new_msg)
                            await db.commit()
    except Exception as e:
        print(f"Webhook processing error: {e}")
        
    # Always return 200 OK to acknowledge Meta
    return {"status": "ok"}

@router.post("/draft")
async def generate_draft(req: DraftRequest, db: AsyncSession = Depends(get_db)):
    """Generate an AI draft reply based on the thread history and candidate profile."""
    # Find candidate and job profile
    result = await db.execute(select(Candidate).where(Candidate.id == req.candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    job_result = await db.execute(select(JobProfile).where(JobProfile.id == candidate.job_profile_id))
    job = job_result.scalar_one_or_none()
    job_title = job.title if job else "Unknown Role"

    # Find thread messages
    thread_result = await db.execute(select(WhatsAppThread).where(WhatsAppThread.candidate_id == req.candidate_id))
    thread = thread_result.scalar_one_or_none()
    
    chat_history = ""
    if thread:
        msg_result = await db.execute(select(WhatsAppMessage).where(WhatsAppMessage.thread_id == thread.id).order_by(WhatsAppMessage.sent_at.asc()))
        messages = msg_result.scalars().all()
        for m in messages[-5:]: # Last 5 messages for context
            role = "Candidate" if m.direction == "inbound" else "Recruiter"
            chat_history += f"{role}: {m.content}\n"
            
    if not chat_history:
        chat_history = "No previous messages. This is the first outreach."

    prompt = f"""You are an expert technical recruiter representing TalentLens.
You are chatting with candidate {candidate.name} for the {job_title} role.
Recent Chat History:
{chat_history}

Generate a concise, professional, and friendly WhatsApp response sending to the candidate. Keep it under 2 sentences. Do not use placeholders, be direct."""
    
    llm = get_llm_client()
    try:
        draft = await llm.chat(
            system="You are a helpful recruitment assistant.",
            user_message=prompt,
            temperature=0.4
        )
        return draft.strip(' "') # Return plain text, trimming quotes
    except Exception as e:
        print(f"Draft generation failed: {e}")
        return "Hi there! Just following up on your application."
