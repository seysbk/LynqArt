import os
import logging
import requests

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Base exception for AI service errors."""
    pass


class AIConfigError(AIServiceError):
    """Raised when AI configuration is missing or invalid."""
    pass


class AIProviderError(AIServiceError):
    """Raised when the AI provider request fails."""

    def __init__(self, message, provider_status=None):
        super().__init__(message)
        self.provider_status = provider_status


SYSTEM_PROMPT = """You are a respectful writing assistant for artists on LynqArt, a digital exhibition and artist statement platform.

Your philosophy and strict guidelines:
1. You are ONLY a writing assistant. The artist is the author and sole decision-maker.
2. Help artists communicate their own ideas with clarity and accuracy, preserving their unique voice.
3. Improve grammar, structure, and expression without altering the core meaning or tone.
4. Use ONLY information, concepts, materials, and notes explicitly supplied by the artist.
5. Absolute Prohibition against Hallucination:
   - Do NOT invent artistic intentions, motivations, or philosophies not stated by the artist.
   - Do NOT invent symbolism, metaphors, or allegories.
   - Do NOT invent cultural, historical, or biographical context.
   - Do NOT invent materials, techniques, process details, or inspirations.
   - Do NOT invent personal experiences or emotional narratives.
   - Never claim an interpretation came from the artist unless the artist explicitly supplied it.
6. If minimal information is provided by the artist (e.g. only title or medium), focus only on organizing the available details into a clean, humble statement framework without fabricating meaning.
7. Return a well-structured, professional GitHub Flavored Markdown draft suitable for artist review.
"""


class AIService:
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    @classmethod
    def get_config(cls):
        provider = os.environ.get("AI_PROVIDER", "openrouter").lower().strip()
        configured_model = os.environ.get("AI_MODEL", "openai/gpt-4o-mini").strip().strip("'\"")
        # .env values are sometimes wrapped in quotes; strip them so the
        # Authorization header is a valid bearer token.
        api_key = os.environ.get("OPENROUTER_API_KEY", "").strip().strip("'\"")

        # OpenRouter routers are passed as the request model. This supports
        # AI_PROVIDER=openrouter/free while retaining direct model selection.
        model = provider if provider.startswith("openrouter/") else configured_model
        return provider, model, api_key

    @classmethod
    def generate_statement(cls, artwork_title, artwork_medium, prompt="", tone="contemplative", mode="statement"):
        provider, model, api_key = cls.get_config()

        if not api_key:
            logger.error("AI Service Error: OPENROUTER_API_KEY environment variable is not set.")
            raise AIConfigError("AI generation service is not configured (missing API key).")

        if provider not in {"openrouter", "openrouter/free"}:
            logger.warning("Unexpected AI_PROVIDER '%s'; using configured model '%s'.", provider, model)

        user_content = (
            f"Artwork Title: {artwork_title or 'Untitled Work'}\n"
            f"Medium / Materials: {artwork_medium or 'Not specified'}\n"
            f"Artist Notes & Concepts: {prompt or 'None provided'}\n"
            f"Desired Tone: {tone}\n"
            f"Mode: {mode}\n\n"
            f"Please draft a {'curator introduction' if mode == 'curator' else 'artist statement'} in GitHub Flavored Markdown based strictly on the above information."
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lynqart.com",
            "X-Title": "LynqArt Platform",
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.7,
        }

        try:
            response = requests.post(cls.OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        except requests.exceptions.Timeout:
            logger.error("OpenRouter API request timed out after 30 seconds.")
            raise AIProviderError("AI service request timed out. Please try again.")
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenRouter network/request error: {e}")
            raise AIProviderError("Could not connect to AI service. Please try again later.")

        if response.status_code != 200:
            message_by_status = {
                401: "Invalid OpenRouter API key.",
                402: "OpenRouter credits or usage are unavailable. Check your account limits and model access.",
                429: "OpenRouter rate limit exceeded. Please wait and try again.",
            }
            if response.status_code in message_by_status:
                error_message = message_by_status[response.status_code]
            elif 500 <= response.status_code <= 599:
                error_message = "OpenRouter/provider is temporarily unavailable. Please try again later."
            else:
                error_message = f"OpenRouter rejected the request (HTTP {response.status_code})."

            try:
                provider_error = response.json().get('error', {})
                provider_detail = provider_error.get('message') if isinstance(provider_error, dict) else None
            except (TypeError, ValueError):
                provider_detail = None

            logger.error(
                "OpenRouter API error status %s: %s",
                response.status_code,
                provider_detail or "no provider detail",
            )
            raise AIProviderError(error_message, provider_status=response.status_code)

        try:
            res_data = response.json()
            generated_text = res_data["choices"][0]["message"]["content"]
            model_used = res_data.get("model", model)
            return generated_text, model_used
        except (KeyError, IndexError, TypeError, ValueError) as e:
            logger.error(f"Failed to parse OpenRouter response: {e}. Raw response: {response.text}")
            raise AIProviderError("Received malformed response from AI provider.")
