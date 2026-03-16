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

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        provider: str | None = None,
        http_referer: str | None = None,
        site_name: str | None = None,
    ):
        settings = get_settings()
        self.provider = provider if provider is not None else settings.AI_PROVIDER
        self.model = model if model is not None else settings.AI_MODEL
        self.embedding_model = settings.AI_EMBEDDING_MODEL

        # API settings - Only fall back to settings if the parameter is None
        self.api_key = api_key if api_key is not None else settings.AI_API_KEY
        self.base_url = base_url if base_url is not None else settings.AI_API_BASE_URL
        self.http_referer = http_referer if http_referer is not None else settings.AI_HTTP_REFERER
        self.site_name = site_name if site_name is not None else settings.AI_SITE_NAME

        # Build extra headers for OpenRouter
        default_headers = {}
        if self.provider == "openrouter":
            default_headers = {
                "HTTP-Referer": self.http_referer,
                "X-Title": self.site_name,
            }

        self.client = AsyncOpenAI(
            api_key=self.api_key or "ollama",  # Ollama doesn't need a real key
            base_url=self.base_url,
            default_headers=default_headers or None,
        )

    async def test_connection(self) -> dict:
        """
        Verify the AI connection by making minimal completion and embedding calls.
        Returns a dict with verification results.
        """
        results = {"chat": "passed", "embedding": "skipped", "model": self.model}
        
        # 1. Test Chat
        try:
            await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
                temperature=0,
            )
        except Exception as e:
            results["chat"] = f"failed: {str(e)}"
            
        # 2. Test Embedding
        if self.embedding_model:
            try:
                await self.client.embeddings.create(
                    model=self.embedding_model,
                    input=["ping"],
                )
                results["embedding"] = "passed"
            except Exception as e:
                results["embedding"] = f"failed: {str(e)}"
        
        return results

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
        max_tokens: int = 4000,
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
            max_tokens=max_tokens,
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
