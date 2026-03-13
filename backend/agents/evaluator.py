"""
TalentLens — Scoring Evaluator Agent
Scores candidate against job profile criteria using LLM.
"""

import json

from agents.llm_client import get_llm_client


EVALUATOR_PROMPT = """You are an expert recruitment evaluator. Score a candidate against the job profile criteria.

For each criterion, provide:
- score: 0-100
- justification: Short explanation (1-2 sentences)
- passFail: "pass" or "fail" (for mandatory criteria only)

Return JSON:
{
  "criterion_scores": {
    "yearsExperience": {"score": 85, "justification": "12 years in construction, exceeds minimum 5", "passFail": "pass"},
    "technicalSkills": {"score": 70, "justification": "Strong AutoCAD and Revit, missing BIM experience"},
    "industryBackground": {"score": 90, "justification": "15 years in UAE construction sector"},
    "certifications": {"score": 60, "justification": "Has PMP but missing NEBOSH"},
    "languages": {"score": 80, "justification": "Fluent English and Arabic, basic Hindi"}
  },
  "final_score": 77,
  "elimination_reason": null
}

Rules:
- final_score = weighted average using the scoring_weights provided
- If any mandatory criterion has passFail="fail", set elimination_reason
- Be objective and evidence-based
- Score relative to the SPECIFIC requirements listed
"""


async def evaluate_candidate(
    candidate_data: dict,
    job_criteria: dict,
    scoring_weights: dict,
) -> dict:
    """
    Score a candidate against job profile criteria.
    Returns criterion-level scores and a weighted final score.
    """
    client = get_llm_client()

    context = f"""
Job Mandatory Criteria:
{json.dumps(job_criteria.get('mandatory', {}), indent=2)}

Job Preferred Criteria:
{json.dumps(job_criteria.get('preferred', {}), indent=2)}

Scoring Weights (sum to 100):
{json.dumps(scoring_weights, indent=2)}

Candidate Data:
{json.dumps(candidate_data, indent=2, default=str)}
"""

    response = await client.chat_json(
        system=EVALUATOR_PROMPT,
        user_message="Score this candidate against the job criteria.",
        context=context,
    )

    try:
        scores = json.loads(response)
    except json.JSONDecodeError:
        scores = {
            "criterion_scores": {},
            "final_score": 0,
            "elimination_reason": "Scoring failed — could not parse LLM response",
        }

    return scores
