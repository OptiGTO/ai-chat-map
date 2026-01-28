import json
import os
from typing import List

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

DEFAULT_MODEL = "gemini-2.5-flash"


class AIResponse(BaseModel):
    answer: str = Field(description="Concise, helpful answer to the user's question.")
    keywords: List[str] = Field(
        description="3-7 short keyword phrases, no duplicates.",
        min_length=3,
        max_length=7,
    )


_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set. Add it to .env.")
        _client = genai.Client(api_key=api_key)
    return _client


def _sanitize_keywords(keywords: List[str]) -> List[str]:
    seen = set()
    cleaned: List[str] = []
    for keyword in keywords:
        trimmed = keyword.strip()
        if not trimmed:
            continue
        dedupe_key = trimmed.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        cleaned.append(trimmed)
    return cleaned[:7]


def generate_answer_and_keywords(message: str) -> AIResponse:
    client = _get_client()
    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)

    system_instruction = (
        "You are a concise assistant for a 3D knowledge map. "
        "Answer in 1-3 short sentences. "
        "Return 3-7 short keyword phrases that capture the core concepts. "
        "Respond only with valid JSON using this schema:\n"
        '{\"answer\": \"...\", \"keywords\": [\"...\", \"...\"]}\n'
    )

    response = client.models.generate_content(
        model=model,
        contents=message,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
        ),
    )
    text = (response.text or "").strip()
    if not text:
        raise RuntimeError("Gemini response was empty.")

    try:
        payload = json.loads(text)
        answer = str(payload.get("answer", "")).strip()
        keywords = payload.get("keywords", [])
        if not answer:
            raise ValueError("Missing answer.")
    except Exception as exc:
        raise RuntimeError("Gemini response parsing failed.") from exc

    return AIResponse(
        answer=answer,
        keywords=_sanitize_keywords(list(keywords) if isinstance(keywords, list) else []),
    )
