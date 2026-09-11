import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ai.ai_provider import (
    AIProvider,
    MockAIProvider,
    GeminiProvider,
    get_ai_provider
)


def test_01_gemini_provider_implements_ai_provider():
    """Verify GeminiProvider inherits from AIProvider abstraction."""
    provider = GeminiProvider(api_key="test_dummy_key", model_name="gemini-2.5-flash-lite")
    assert isinstance(provider, AIProvider)
    assert provider.model_name == "gemini-2.5-flash-lite"


def test_02_factory_selects_gemini():
    """Verify provider factory returns GeminiProvider when AI_PROVIDER=gemini."""
    with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "test_key_123", "MOCK_AI": "false"}):
        provider = get_ai_provider()
        assert isinstance(provider, GeminiProvider)
        assert provider.api_key == "test_key_123"


def test_03_factory_selects_mock():
    """Verify provider factory returns MockAIProvider when AI_PROVIDER=mock."""
    with patch.dict(os.environ, {"AI_PROVIDER": "mock", "MOCK_AI": "false"}):
        provider = get_ai_provider()
        assert isinstance(provider, MockAIProvider)


def test_04_missing_api_key_raises_configuration_error():
    """Verify missing GEMINI_API_KEY raises a clear configuration ValueError when AI_PROVIDER=gemini."""
    with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "", "AI_API_KEY": "", "MOCK_AI": "false"}):
        with pytest.raises(ValueError) as exc_info:
            get_ai_provider()
        assert "GEMINI_API_KEY environment variable is required" in str(exc_info.value)


@pytest.mark.anyio
async def test_05_gemini_response_parsed_successfully():
    """Verify mock Gemini API JSON response parses into valid field mapping structure."""
    provider = GeminiProvider(api_key="test_dummy_key", model_name="gemini-2.5-flash-lite")

    mock_res = MagicMock()
    mock_res.text = '{"canonical_field": "annual_income", "confidence": 0.94, "reason": "Yearly family earnings maps to annual_income"}'
    if provider.client:
        provider.client.models.generate_content = MagicMock(return_value=mock_res)

    result = await provider.analyze_field(
        department="Education",
        source_field="yearlyFamilyEarnings",
        source_type="number",
        source_description="Annual family earnings in INR"
    )

    assert result["source_field"] == "yearlyFamilyEarnings"
    assert result["canonical_field"] == "annual_income"
    assert result["confidence"] == 0.94
    assert result["status"] == "SUGGESTED"
    assert result["requires_human_approval"] is True


@pytest.mark.anyio
async def test_06_invalid_canonical_field_rejected():
    """Verify Gemini returning an unapproved/non-existent canonical field is rejected by governance rule."""
    provider = GeminiProvider(api_key="test_dummy_key")

    mock_res = MagicMock()
    mock_res.text = '{"canonical_field": "some_new_nonexistent_field", "confidence": 0.99, "reason": "Hallucinated field"}'
    if provider.client:
        provider.client.models.generate_content = MagicMock(return_value=mock_res)

    result = await provider.analyze_field(
        department="Education",
        source_field="yearlyFamilyEarnings",
        source_type="number",
        source_description="Annual earnings"
    )

    assert result["canonical_field"] != "some_new_nonexistent_field"
    assert "Rejected by governance rule" in result.get("reason", "") or result.get("status") in ["SUGGESTED", "NEEDS_REVIEW"]


@pytest.mark.anyio
async def test_07_out_of_bounds_confidence_bounded():
    """Verify out-of-bounds confidence scores are clamped between 0.0 and 1.0."""
    provider = GeminiProvider(api_key="test_dummy_key")

    mock_res = MagicMock()
    mock_res.text = '{"canonical_field": "annual_income", "confidence": 1.5, "reason": "Super high confidence"}'
    if provider.client:
        provider.client.models.generate_content = MagicMock(return_value=mock_res)

    result = await provider.analyze_field(
        department="Education",
        source_field="yearlyFamilyEarnings",
        source_type="number",
        source_description="Earnings"
    )

    assert result["confidence"] <= 1.0


@pytest.mark.anyio
async def test_08_suggestion_remains_suggested_never_approved():
    """Verify Gemini suggestions ALWAYS return status SUGGESTED or NEEDS_REVIEW, never APPROVED."""
    provider = GeminiProvider(api_key="test_dummy_key")

    mock_res = MagicMock()
    mock_res.text = '{"canonical_field": "annual_income", "confidence": 0.95, "reason": "Clear match"}'
    if provider.client:
        provider.client.models.generate_content = MagicMock(return_value=mock_res)

    result = await provider.analyze_field(
        department="Education",
        source_field="yearlyFamilyEarnings",
        source_type="number",
        source_description="Earnings"
    )

    assert result["status"] in ["SUGGESTED", "NEEDS_REVIEW"]
    assert result["status"] != "APPROVED"
    assert result["requires_human_approval"] is True


@pytest.mark.anyio
async def test_09_gemini_failure_handled_safely():
    """Verify provider exception triggers controlled fallback without crashing or approving mappings."""
    provider = GeminiProvider(api_key="test_dummy_key")
    if provider.client:
        provider.client.models.generate_content = MagicMock(side_effect=RuntimeError("API Network Timeout"))

    result = await provider.analyze_field(
        department="Education",
        source_field="yearlyFamilyEarnings",
        source_type="number",
        source_description="Earnings"
    )

    assert result is not None
    assert result["status"] in ["SUGGESTED", "NEEDS_REVIEW"]
    assert "Gemini provider error" in result["reason"]
