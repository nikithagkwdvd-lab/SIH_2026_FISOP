import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ai.ai_provider import GeminiProvider

# Skip unless RUN_LIVE_AI_TESTS=true and GEMINI_API_KEY is configured
SKIP_LIVE = os.getenv("RUN_LIVE_AI_TESTS", "false").lower() != "true" or not os.getenv("GEMINI_API_KEY")


@pytest.mark.skipif(
    SKIP_LIVE,
    reason="Live Gemini API tests disabled. Set RUN_LIVE_AI_TESTS=true and GEMINI_API_KEY to execute live API test."
)
@pytest.mark.anyio
async def test_live_gemini_schema_analysis():
    """
    Live E2E test against Google Gemini 2.5 Flash-Lite API.
    Sends synthetic Education department schema field 'yearlyFamilyEarnings'.
    Verifies semantic mapping returns 'annual_income'.
    """
    api_key = os.environ["GEMINI_API_KEY"]
    model_name = os.getenv("AI_MODEL", "gemini-2.5-flash-lite")

    provider = GeminiProvider(api_key=api_key, model_name=model_name)

    result = await provider.analyze_field(
        department="Education",
        source_field="yearlyFamilyEarnings",
        source_type="number",
        source_description="Annual income of the student's family"
    )

    assert result["source_field"] == "yearlyFamilyEarnings"
    assert result["canonical_field"] == "annual_income"
    assert result["confidence"] > 0.50
    assert result["status"] in ["SUGGESTED", "NEEDS_REVIEW"]
    assert result["requires_human_approval"] is True
