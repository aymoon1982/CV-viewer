import logging
import httpx
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.schemas import WhatsAppThread, WhatsAppMessage, Candidate
from config import get_settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.settings = get_settings()
        # Ensure we have defaults if not set
        self.token = getattr(self.settings, 'WA_ACCESS_TOKEN', None)
        self.phone_number_id = getattr(self.settings, 'WA_PHONE_NUMBER_ID', None)
        self.api_version = "v19.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}"

    async def send_message(self, db: AsyncSession, to_number: str, text: str, candidate_id: str, thread_id: str = None) -> bool:
        """Send a free-form text message via WhatsApp API."""
        if not self.token or not self.phone_number_id:
            logger.warning("WhatsApp API credentials missing. Simulating send to DB only.")
            await self._record_message(db, thread_id, to_number, text, candidate_id, "outbound")
            return True

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_number,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": text
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.base_url}/messages", headers=headers, json=payload)
                response.raise_for_status()
                logger.info(f"WhatsApp message sent to {to_number}")
                
                await self._record_message(db, thread_id, to_number, text, candidate_id, "outbound")
                return True
            except Exception as e:
                logger.error(f"Failed to send WhatsApp message: {e}")
                # Still record in local DB for testing purposes
                await self._record_message(db, thread_id, to_number, text, candidate_id, "outbound")
                return False

    async def _record_message(self, db: AsyncSession, thread_id: str, phone: str, text: str, candidate_id: str, direction: str):
        """Record the message in the DB."""
        if not thread_id:
            # Find or create a new thread for this candidate
            result = await db.execute(select(WhatsAppThread).where(WhatsAppThread.candidate_id == candidate_id))
            thread = result.scalar_one_or_none()
            if not thread:
                result_cand = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
                candidate = result_cand.scalar_one_or_none()
                job_id = candidate.job_profile_id if candidate else None
                
                thread = WhatsAppThread(
                    candidate_id=candidate_id,
                    job_profile_id=job_id,
                    phone_number=phone,
                    status="screening"
                )
                db.add(thread)
                await db.flush()
            thread_id = thread.id
            
        msg = WhatsAppMessage(
            thread_id=thread_id,
            direction=direction,
            content=text,
            message_type="free_text"
        )
        db.add(msg)
        await db.commit()

whatsapp_service = WhatsAppService()
