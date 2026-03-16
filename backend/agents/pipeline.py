"""
TalentLens — Scoring Pipeline
Orchestrates the full CV processing pipeline:
  CV File → Extract Text → Parse Structured Data → Hard Filter → Score → Critic Review → Summarize
"""

import logging
import asyncio

from services.cv_processor import extract_text
from agents.extractor import extract_candidate_data
from agents.evaluator import evaluate_candidate
from agents.critic import review_scores
from agents.summarizer import generate_summary

logger = logging.getLogger(__name__)


async def run_scoring_pipeline(
    candidate,
    job_profile,
    pipeline_cfg: dict | None = None,
) -> dict:
    """
    Run the full scoring pipeline for a candidate against a job profile.

    Pipeline stages:
    1. Extract raw text from CV file
    2. Parse structured candidate data via LLM
    3. Apply hard filters (mandatory criteria check)
    4. Score against criteria via LLM
    5. Critic review for quality assurance (skippable)
    6. Generate AI summary (skippable)

    Args:
        candidate: Candidate ORM object (must have cv_file_path)
        job_profile: JobProfile ORM object
        pipeline_cfg: Optional dict of pipeline settings (from DB AppSetting["pipeline"]).
                      All keys are optional; defaults match original hardcoded values.

    Returns:
        dict with all extracted data, scores, and AI summary
    """
    # Merge provided config with defaults so every key is always present
    cfg: dict = {
        "cvCharLimit": 8000,
        "minTextLength": 50,
        "skipCritic": False,
        "skipSummary": False,
        "extractionTemperature": 0.1,
        "scoringTemperature": 0.1,
        "criticTemperature": 0.1,
        "summaryTemperature": 0.3,
        "summaryMaxTokens": 300,
        "scoringMaxTokens": 4000,
        "shortlistThreshold": 0,
        "autoRejectThreshold": 0,
    }
    if pipeline_cfg:
        cfg.update(pipeline_cfg)

    result = {}

    # ─── Stage 1: Extract raw text ──────────────────────────────────────
    logger.info(f"[Pipeline] Stage 1: Extracting text from {candidate.cv_file_path}")
    try:
        raw_text = await asyncio.to_thread(extract_text, candidate.cv_file_path)
        min_len = cfg["minTextLength"]
        if not raw_text or len(raw_text) < min_len:
            return {
                "status": "eliminated",
                "final_score": 0,
                "criterion_scores": {},
                "ai_summary": "Could not extract meaningful text from the CV file.",
                "extraction_confidence": 0,
                "elimination_reason": f"CV text extraction failed or file is too short (< {min_len} chars)",
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
    extracted = await extract_candidate_data(
        raw_text,
        char_limit=cfg["cvCharLimit"],
        temperature=cfg["extractionTemperature"],
    )
    
    if "error" in extracted:
        # Structured extraction failed (e.g. AI error)
        return {
            "status": "failed", # status is 'failed' if AI error happens
            "final_score": 0,
            "criterion_scores": {},
            "ai_summary": f"AI Extraction Failed: {extracted['error']}",
            "elimination_reason": f"AI Provider Error: {extracted['error']}",
        }
        
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
        temperature=cfg["scoringTemperature"],
        max_tokens=cfg["scoringMaxTokens"],
    )

    if "error" in scores:
        # Scoring failed (e.g. AI error)
        return {
            "status": "failed",
            "final_score": 0,
            "criterion_scores": {},
            "ai_summary": f"AI Scoring Failed: {scores['error']}",
            "elimination_reason": f"AI Provider Error: {scores['error']}",
        }

    # ─── Stage 5: Critic review ────────────────────────────────────────
    logger.info(f"[Pipeline] Stage 5: Critic review (enabled={not cfg['skipCritic']})")
    reviewed_scores = await review_scores(
        candidate_data=extracted,
        job_criteria=job_criteria,
        scores=scores,
        enabled=not cfg["skipCritic"],
        temperature=cfg["criticTemperature"],
    )

    # ─── Stage 6: Generate summary ─────────────────────────────────────
    final_score = reviewed_scores.get("final_score", 0)
    if cfg["skipSummary"]:
        logger.info("[Pipeline] Stage 6: Summary skipped (disabled in pipeline settings)")
        summary = "Summary generation disabled in pipeline settings."
    else:
        logger.info("[Pipeline] Stage 6: Generating AI summary")
        try:
            summary = await generate_summary(
                candidate_data=extracted,
                scores=reviewed_scores,
                temperature=cfg["summaryTemperature"],
                max_tokens=cfg["summaryMaxTokens"],
            )
        except Exception as summ_err:
            logger.error(f"[Pipeline] Summary generation failed: {summ_err}")
            summary = "Scoring complete, but summary generation failed."

    # ─── Determine final status based on thresholds ────────────────────
    auto_reject = cfg["autoRejectThreshold"]
    shortlist_threshold = cfg["shortlistThreshold"]
    elimination_reason = reviewed_scores.get("elimination_reason")

    if auto_reject > 0 and final_score < auto_reject:
        final_status = "eliminated"
        elimination_reason = (
            elimination_reason or
            f"Score {final_score:.0f} below auto-reject threshold ({auto_reject})"
        )
    elif shortlist_threshold > 0 and final_score >= shortlist_threshold:
        final_status = "shortlisted"
    else:
        final_status = "scored"

    # ─── Combine results ───────────────────────────────────────────────
    result.update({
        "status": final_status,
        "final_score": final_score,
        "criterion_scores": reviewed_scores.get("criterion_scores", {}),
        "ai_summary": summary,
        "elimination_reason": elimination_reason,
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
        # Safe lookup — treat unknown degree levels as "any" to avoid ValueError
        cand_idx = degree_order.index(candidate_level) if candidate_level in degree_order else 0
        min_idx = degree_order.index(min_level) if min_level in degree_order else 0
        if cand_idx < min_idx:
            reasons.append(
                f"Degree level ({candidate_level}) below required ({min_level})"
            )

    # Check required certifications
    required_certs = mandatory.get("certifications", [])
    candidate_certs = [c.lower() for c in extracted.get("certifications", [])]
    for cert in required_certs:
        cert_lower = cert.lower()
        # Exact match first
        if cert_lower in candidate_certs:
            continue
        # Word-boundary fuzzy: all words in required cert must appear in at least one candidate cert
        cert_words = set(cert_lower.split())
        found = any(cert_words.issubset(set(cc.split())) for cc in candidate_certs)
        if not found:
            reasons.append(f"Missing required certification: {cert}")

    if reasons:
        return "; ".join(reasons)
    return None
