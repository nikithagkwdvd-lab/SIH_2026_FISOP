"""
SQLAlchemy ORM models for Interoperability Platform database layer.
"""
from app.db.models.citizen import Citizen
from app.db.models.department import Department
from app.db.models.application import Application, ApplicationStatus
from app.db.models.consent import Consent, ConsentStatus
from app.db.models.identity_mapping import IdentityMapping
from app.db.models.workflow_instance import WorkflowInstance, WorkflowStatus
from app.db.models.audit_log import AuditLog, AuditAction
from app.db.models.notification import Notification, NotificationStatus
from app.db.models.api_metric import ApiMetric
from app.db.models.sla import SlaDefinition, SlaRecord, SlaStatus
from app.db.models.data_quality import DataQualityResult
from app.db.models.ai_mapping_suggestion import AiMappingSuggestion, MappingSuggestionStatus
from app.db.models.canonical_mapping import CanonicalMapping

__all__ = [
    "Citizen",
    "Department",
    "Application",
    "ApplicationStatus",
    "Consent",
    "ConsentStatus",
    "IdentityMapping",
    "WorkflowInstance",
    "WorkflowStatus",
    "AuditLog",
    "AuditAction",
    "Notification",
    "NotificationStatus",
    "ApiMetric",
    "SlaDefinition",
    "SlaRecord",
    "SlaStatus",
    "DataQualityResult",
    "AiMappingSuggestion",
    "MappingSuggestionStatus",
    "CanonicalMapping"
]
