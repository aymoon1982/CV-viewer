"""
TalentLens — Scoring Pipeline
Orchestrates the full CV processing pipeline:
  CV File → Extract Text → Parse Structured Data → Hard Filter → Score → Critic Review → Summarize
"""

import logging

from services.cv_processor import extract_text
from agents.extractor import extract_candidate_data
from agents.evaluator import evaluate_candidate
from agents.critic import review_scores
from agents.summarizer import generate_summary

logger = logging.getLogger(__name__)


async def run_scoring_pipeline(candidate, job_profile) -> dict:
    """
    Run the full scoring pipeline for a candidate against a job profile.

    Pipeline stages:
    1. Extract raw text from CV file
    2. Parse structured candidate data via LLM
    3. Apply hard filters (mandatory criteria check)
    4. Score against criteria via LLM
    5. Critic review for quality assurance
    6. Generate AI summary

    Args:
        candidate: Candidate ORM object (must have cv_file_path)
        job_profile: JobProfile ORM object

    Returns:
        dict with all extracted data, scores, and AI summary
    """
    result = {}

    # ─── Stage 1: Extract raw text ──────────────────────────────────────
    logger.info(f"[Pipeline] Stage 1: Extracting text from {candidate.cv_file_path}")
    try:
        raw_text = extract_text(candidate.cv_file_path)
        if not raw_text or len(raw_text) < 50:
            return {
                "status": "eliminated",
                "final_score": 0,
                "criterion_scores": {},
                "ai_summary": "Could not extract meaningful text from the CV file.",
                "extraction_confidence": 0,
                "elimination_reason": "CV text extraction failed or file is empty",
            }
            
        # ─── Index text into Vector Store for Chat RAG ────────────
        try:
            from services.vector_store import index_candidate_cv
            index_candidate_cv(candidate.id, job_profile.id, raw_text)
            logger.info(f"[Pipeline] Vector indexing complete for {candidate.id}")
        except Exception as vec_err:
            logger.error(f"[Pipeline] Vector indexing failed: {vec_err}")
            
    except Exception as e:
        logger.error(f"[Pipeline] Text extraction failed: {e}")
        return {
            "status": "eliminated",
            "final_score": 0,
            "criterion_scores": {},
            "ai_summary": f"Text extraction error: {str(e)}",
            "extraction_confidence": 0,
            "elimination_reason": f"File processing error: {str(e)}",
        }

    # ─── Stage 2: Structured extraction via LLM ────────────────────────
    logger.info("[Pipeline] Stage 2: Extracting structured data via LLM")
    extracted = await extract_candidate_data(raw_text)
    result.update(extracted)

    # ─── Stage 3: Hard filter (mandatory criteria) ─────────────────────
    logger.info("[Pipeline] Stage 3: Applying hard filters")
    mandatory = job_profile.mandatory_criteria or {}
    elimination = _apply_hard_filters(extracted, mandatory)
    if elimination:
        result.update({
            "status": "eliminated",
            "final_score": 0,
            "criterion_scores": {},
            "ai_summary": f"Eliminated: {elimination}",
            "elimination_reason": elimination,
        })
        return result

    # ─── Stage 4: Criterion scoring via LLM ────────────────────────────
    logger.info("[Pipeline] Stage 4: Scoring against criteria")
    job_criteria = {
        "mandatory": job_profile.mandatory_criteria or {},
        "preferred": job_profile.preferred_criteria or {},
    }
    scores = await evaluate_candidate(
        candidate_data=extracted,
        job_criteria=job_criteria,
        scoring_weights=job_profile.scoring_weights or {},
    )

    # ─── Stage 5: Critic review ────────────────────────────────────────
    logger.info("[Pipeline] Stage 5: Critic review")
    reviewed_scores = await review_scores(
        candidate_data=extracted,
        scores=scores,
        job_criteria=job_criteria,
    )

    # ─── Stage 6: Generate summary ─────────────────────────────────────
    logger.info("[Pipeline] Stage 6: Generating AI summary")
    summary = await generate_summary(extracted, reviewed_scores)

    # ─── Combine results ───────────────────────────────────────────────
    result.update({
        "status": "scored",
        "final_score": reviewed_scores.get("final_score", 0),
        "criterion_scores": reviewed_scores.get("criterion_scores", {}),
        "ai_summary": summary,
        "elimination_reason": reviewed_scores.get("elimination_reason"),
    })

    logger.info(f"[Pipeline] Complete: {result.get('name', 'Unknown')} scored {result['final_score']}")
    return result


def _apply_hard_filters(extracted: dict, mandatory: dict) -> str | None:
    """
    Check mandatory criteria. Returns elimination reason or None if passed.
    This is pure Python logic — no LLM needed.
    """
    reasons = []

    # Check minimum years of experience
    min_years = mandatory.get("yearsMin", 0)
    candidate_years = extracted.get("years_experience", 0)
    if min_years and candidate_years < min_years:
        reasons.append(f"Experience ({candidate_years}yr) below minimum ({min_years}yr)")

    # Check degree requirement
    if mandatory.get("degreeRequired", False):
        min_level = mandatory.get("minDegreeLevel", "any")
        candidate_level = extracted.get("degree_level", "any")
        degree_order = ["any", "diploma", "bachelor", "master", "phd"]
        if degree_order.index(candidate_level) < degree_order.index(min_level):
            reasons.append(
                f"Degree level ({candidate_level}) below required ({min_level})"
            )

    # Check required certifications
    required_certs = mandatory.get("certifications", [])
    candidate_certs = [c.lower() for c in extracted.get("certifications", [])]
    for cert in required_certs:
        if cert.lower() not in candidate_certs:
            # Fuzzy match: check if cert name is contained in any candidate cert
            found = any(cert.lower() in cc for cc in candidate_certs)
            if not found:
                reasons.append(f"Missing required certification: {cert}")

    if reasons:
        return "; ".join(reasons)
    return None
