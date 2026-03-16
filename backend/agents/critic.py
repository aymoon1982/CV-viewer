"""
TalentLens — Critic Agent
Validates and refines scores from the evaluator.
"""

import json
import logging

from agents.llm_client import get_llm_client

logger = logging.getLogger(__name__)


CRITIC_PROMPT = """You are a quality assurance reviewer for an AI recruitment scoring system.
Review the scores assigned by the evaluator and flag any issues.

Check for:
1. Score inflation or deflation (scores not matching the justification)
2. Missing mandatory criteria that should have been flagged
3. Inconsistencies between criterion scores and the final score
4. Justifications that don't reference specific candidate evidence

Return JSON:
{
  "approved": true/false,
  "adjustments": {
    "criterion_name": {"original_score": 85, "adjusted_score": 70, "reason": "Score inflated..."}
  },
  "adjusted_final_score": 72,
  "flags": ["Any warnings or notes"]
}

If approved=true, return the original scores unchanged. Only adjust if there are clear errors.
"""


async def review_scores(
    candidate_data: dict,
    scores: dict,
    job_criteria: dict,
    enabled: bool = True,
    temperature: float = 0.1,
) -> dict:
    """
    Review and validate scores from the evaluator.
    Returns adjusted scores if discrepancies are found.
    If enabled=False, passes scores through unchanged.
    """
    if not enabled:
        scores["review_flags"] = ["Critic review skipped (disabled in pipeline settings)"]
        return scores

    client = get_llm_client()

    context = f"""
Original Scores:
{json.dumps(scores, indent=2)}

Candidate Data:
{json.dumps(candidate_data, indent=2, default=str)}

Job Criteria:
{json.dumps(job_criteria, indent=2)}
"""

    try:
        response = await client.chat_json(
            system=CRITIC_PROMPT,
            user_message="Review these candidate scores for accuracy and consistency.",
            context=context,
            temperature=temperature,
        )
        review = json.loads(response)
    except Exception as e:
        logger.warning(f"[Critic] Review failed ({e}), passing scores unchanged")
        review = {"approved": True, "adjustments": {}, "flags": [f"Critic unavailable: {str(e)}"]}

    # Apply adjustments if needed
    if not review.get("approved", True) and review.get("adjustments"):
        criterion_scores = scores.get("criterion_scores", {})
        for criterion, adj in review["adjustments"].items():
            if criterion in criterion_scores:
                criterion_scores[criterion]["score"] = adj["adjusted_score"]
                criterion_scores[criterion]["justification"] += f" [Adjusted: {adj['reason']}]"

        scores["criterion_scores"] = criterion_scores
        if "adjusted_final_score" in review:
            scores["final_score"] = review["adjusted_final_score"]

    scores["review_flags"] = review.get("flags", [])
    return scores
