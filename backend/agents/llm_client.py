"""
TalentLens — Unified LLM Client
Single API client for all AI operations. Supports OpenAI-compatible endpoints.
Change provider via env vars or Settings page — affects all AI features at once.
"""

from typing import AsyncIterator

from openai import AsyncOpenAI

from config import get_settings

_client_instance: "LLMClient | None" = None


class LLMClient:
    """
    Unified LLM client that wraps the OpenAI Python SDK.
    Works with any OpenAI-compatible API:
    - OpenAI (default)
    - Anthropic (via LiteLLM or proxy)
    - Ollama (http://localhost:11434/v1)
    - vLLM, Together AI, Groq, etc.
    """

    def __init__(self):
        settings = get_settings()
        self.model = settings.AI_MODEL
        self.embedding_model = settings.AI_EMBEDDING_MODEL

        # Build extra headers for OpenRouter
        default_headers = {}
        if settings.is_openrouter:
            default_headers = {
                "HTTP-Referer": settings.AI_HTTP_REFERER,
                "X-Title": settings.AI_SITE_NAME,
            }

        self.client = AsyncOpenAI(
            api_key=settings.AI_API_KEY or "ollama",  # Ollama doesn't need a real key
            base_url=settings.AI_API_BASE_URL,
            default_headers=default_headers or None,
        )

    async def chat(
        self,
        system: str,
        user_message: str,
        context: str = "",
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> str:
        """Single-shot chat completion. Returns full response text."""
        messages = [{"role": "system", "content": system}]
        if context:
            messages.append({"role": "user", "content": f"Context:\n{context}"})
        messages.append({"role": "user", "content": user_message})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def chat_json(
        self,
        system: str,
        user_message: str,
        context: str = "",
        temperature: float = 0.1,
    ) -> str:
        """Chat completion that requests JSON output."""
        messages = [{"role": "system", "content": system + "\n\nRespond ONLY with valid JSON."}]
        if context:
            messages.append({"role": "user", "content": f"Context:\n{context}"})
        messages.append({"role": "user", "content": user_message})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content or "{}"

    async def stream_chat(
        self,
        system: str,
        message: str,
        context: str = "",
        temperature: float = 0.4,
    ) -> AsyncIterator[str]:
        """Streaming chat completion. Yields text chunks."""
        messages = [{"role": "system", "content": system}]
        if context:
            messages.append({"role": "user", "content": f"Context:\n{context}"})
        messages.append({"role": "user", "content": message})

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=2000,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=texts,
        )
        return [item.embedding for item in response.data]


def get_llm_client() -> LLMClient:
    """Get or create the singleton LLM client."""
    global _client_instance
    if _client_instance is None:
        _client_instance = LLMClient()
    return _client_instance


def _clear_client_cache():
    """Clear the cached client (called when AI settings change at runtime)."""
    global _client_instance
    _client_instance = None
