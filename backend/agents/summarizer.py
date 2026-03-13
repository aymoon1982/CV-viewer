"""
TalentLens — Summarizer Agent
Generates concise candidate summaries.
"""

from agents.llm_client import get_llm_client


SUMMARIZER_PROMPT = """You are a recruitment summary writer. Write a concise 3-sentence summary of this candidate.

Sentence 1: Who they are (current role, experience level, key strength).
Sentence 2: How they match the job (top matching criteria, notable qualifications).
Sentence 3: Key concern or differentiator (gap, weakness, or standout factor).

Be specific and evidence-based. Mention numbers, company names, or certifications.
Do NOT use generic phrases like "strong candidate" without evidence.
"""


async def generate_summary(
    candidate_data: dict,
    scores: dict,
) -> str:
    """
    Generate a 3-sentence executive summary for a candidate.
    """
    client = get_llm_client()

    context = f"""
Candidate: {candidate_data.get('name', 'Unknown')}
Current: {candidate_data.get('current_title', '')} at {candidate_data.get('current_company', '')}
Experience: {candidate_data.get('years_experience', 0)} years
Score: {scores.get('final_score', 0)}/100
Top skills: {', '.join(s.get('name', '') for s in (candidate_data.get('skills', [])[:5]))}
Criterion Scores: {scores.get('criterion_scores', {})}
"""

    summary = await client.chat(
        system=SUMMARIZER_PROMPT,
        user_message="Write a 3-sentence summary for this candidate.",
        context=context,
        max_tokens=300,
    )

    return summary.strip()
