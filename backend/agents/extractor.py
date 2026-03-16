"""
TalentLens — CV Extraction Agent
Uses LLM to extract structured candidate data from raw CV text.
"""

import json
import logging

from agents.llm_client import get_llm_client

logger = logging.getLogger(__name__)

_CV_CHAR_LIMIT = 8000


EXTRACTION_PROMPT = """You are an expert HR data extraction system. Extract structured candidate information from the CV text below.

Return a JSON object with these fields:
{
  "name": "Full name",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "nationality": "Nationality if mentioned, or null",
  "age": null,
  "languages": ["list of languages"],
  "current_title": "Most recent job title",
  "current_company": "Most recent employer",
  "years_experience": 0,
  "degree_level": "any|diploma|bachelor|master|phd",
  "degree_field": "Field of study",
  "education": [
    {"institution": "...", "degree": "...", "field": "...", "year": 2020, "grade": "..."}
  ],
  "experience": [
    {"company": "...", "title": "...", "startDate": "...", "endDate": "...", "duration": "...", "description": "..."}
  ],
  "skills": [
    {"name": "Skill Name", "confidence": 0.9}
  ],
  "certifications": ["cert1", "cert2"],
  "extraction_confidence": 0.85
}

Rules:
- Calculate years_experience by summing employment durations
- Set degree_level to the highest degree found
- For confidence, estimate how certain you are about each extracted field (0-1)
- extraction_confidence is your overall confidence in the extraction quality
- If a field is not found, use null or empty array as appropriate
"""


async def extract_candidate_data(
    cv_text: str,
    char_limit: int = _CV_CHAR_LIMIT,
    temperature: float = 0.1,
) -> dict:
    """
    Extract structured candidate data from raw CV text using the LLM.
    Returns a dictionary matching the Candidate model fields.
    """
    client = get_llm_client()

    try:
        if len(cv_text) > char_limit:
            logger.warning(
                f"[Extractor] CV truncated from {len(cv_text)} to {char_limit} chars — "
                "skills/certifications near the end may be missed"
            )
        response = await client.chat_json(
            system=EXTRACTION_PROMPT,
            user_message=f"Extract candidate data from this CV:\n\n{cv_text[:char_limit]}",
            temperature=temperature,
        )
        data = json.loads(response)
    except Exception as e:
        # Catch both LLM errors (auth, quota) and JSON parsing errors
        data = {
            "name": "Unknown (Extraction Error)",
            "extraction_confidence": 0.0,
            "skills": [],
            "education": [],
            "experience": [],
            "certifications": [],
            "languages": [],
            "error": str(e) # Store error for the pipeline to report
        }

    return data
