import time
import uuid
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_

from app.db.models.api_metric import ApiMetric
from app.db.models.sla import SlaDefinition, SlaRecord, SlaStatus
from app.db.models.data_quality import DataQualityResult
from app.db.models.application import Application, ApplicationStatus
from app.db.models.workflow_instance import WorkflowInstance, WorkflowStatus
from app.db.models.audit_log import AuditLog, AuditAction
from app.services.error_taxonomy import classify_error, ErrorCategory
from app.db.base import utc_now

DEFAULT_SLA_LIMITS = {
    "INCOME_VERIFICATION": 5000.0,
    "PROPERTY_VERIFICATION": 5000.0,
    "WELFARE_VERIFICATION": 5000.0,
    "TOTAL_APPLICATION_PROCESSING": 15000.0
}


import os

class ObservabilityService:
    def __init__(self, db: Session):
        self.db = db

    async def check_services_health(self) -> List[Dict[str, Any]]:
        """
        Actively monitors Department Microservices connectivity and latency using environment-configured URLs.
        """
        rev_url = os.getenv("REVENUE_API_URL", "http://localhost:8001").rstrip("/") + "/health"
        land_url = os.getenv("LAND_API_URL", "http://localhost:8002").rstrip("/") + "/health"
        wel_url = os.getenv("WELFARE_API_URL", "http://localhost:8003").rstrip("/") + "/health"

        targets = [
            {"service": "REVENUE", "url": rev_url},
            {"service": "LAND", "url": land_url},
            {"service": "WELFARE", "url": wel_url}
        ]

        results = []
        async with httpx.AsyncClient(timeout=2.0) as client:
            for t in targets:
                start = time.perf_counter()
                try:
                    res = await client.get(t["url"])
                    latency = round((time.perf_counter() - start) * 1000, 2)
                    if res.status_code == 200:
                        status = "HEALTHY" if latency < 1000 else "DEGRADED"
                    else:
                        status = "DEGRADED"
                except Exception:
                    latency = round((time.perf_counter() - start) * 1000, 2)
                    status = "UNAVAILABLE"

                results.append({
                    "service": t["service"],
                    "status": status,
                    "last_checked": utc_now().isoformat(),
                    "response_time_ms": latency
                })
        return results

    def record_api_metric(
        self,
        department: str,
        operation: str,
        status: str,
        duration_ms: float,
        application_id: Optional[uuid.UUID] = None,
        workflow_instance_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        http_status: Optional[int] = None,
        retry_count: int = 0,
        error_category: Optional[str] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None
    ) -> ApiMetric:
        now = utc_now()
        start = started_at or now
        comp = completed_at or now

        metric = ApiMetric(
            application_id=application_id,
            workflow_instance_id=workflow_instance_id,
            trace_id=trace_id,
            department=department.upper(),
            operation=operation.upper(),
            status=status.upper(),
            http_status=http_status,
            duration_ms=round(duration_ms, 2),
            retry_count=retry_count,
            error_category=error_category,
            started_at=start,
            completed_at=comp
        )
        self.db.add(metric)
        self.db.commit()
        self.db.refresh(metric)

        # Check and record SLA
        self.evaluate_and_record_sla(
            operation=operation.upper(),
            department=department.upper(),
            duration_ms=duration_ms,
            started_at=start,
            completed_at=comp,
            application_id=application_id,
            workflow_instance_id=workflow_instance_id
        )

        return metric

    def evaluate_and_record_sla(
        self,
        operation: str,
        department: Optional[str],
        duration_ms: float,
        started_at: datetime,
        completed_at: datetime,
        application_id: Optional[uuid.UUID] = None,
        workflow_instance_id: Optional[str] = None
    ) -> SlaRecord:
        # Get SLA limit definition or default
        sla_def = self.db.scalars(
            select(SlaDefinition).where(SlaDefinition.operation == operation)
        ).first()

        limit_ms = sla_def.limit_ms if sla_def else DEFAULT_SLA_LIMITS.get(operation, 5000.0)
        sla_status = SlaStatus.SLA_BREACHED if duration_ms > limit_ms else SlaStatus.SLA_MET

        record = SlaRecord(
            application_id=application_id,
            workflow_instance_id=workflow_instance_id,
            operation=operation,
            department=department,
            started_at=started_at,
            completed_at=completed_at,
            duration_ms=round(duration_ms, 2),
            sla_limit_ms=limit_ms,
            status=sla_status
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def record_data_quality_result(
        self,
        department: str,
        operation: str,
        completeness_score: float,
        validity_score: float,
        overall_score: float,
        errors: List[Dict[str, str]],
        application_id: Optional[uuid.UUID] = None
    ) -> DataQualityResult:
        dq_record = DataQualityResult(
            application_id=application_id,
            department=department.upper(),
            operation=operation.upper(),
            completeness_score=completeness_score,
            validity_score=validity_score,
            overall_score=overall_score,
            validation_errors=errors
        )
        self.db.add(dq_record)
        self.db.commit()
        self.db.refresh(dq_record)
        return dq_record

    def get_aggregated_metrics(self) -> Dict[str, Any]:
        total_reqs = self.db.scalars(select(func.count(ApiMetric.id))).first() or 0
        success_reqs = self.db.scalars(
            select(func.count(ApiMetric.id)).where(ApiMetric.status == "SUCCESS")
        ).first() or 0
        failed_reqs = total_reqs - success_reqs
        failure_rate = round((failed_reqs / total_reqs * 100.0), 2) if total_reqs > 0 else 0.0

        avg_latency = self.db.scalars(select(func.avg(ApiMetric.duration_ms))).first() or 0.0

        dept_stats = {}
        for dept in ["REVENUE", "LAND", "WELFARE"]:
            d_reqs = self.db.scalars(
                select(func.count(ApiMetric.id)).where(ApiMetric.department == dept)
            ).first() or 0
            d_fails = self.db.scalars(
                select(func.count(ApiMetric.id)).where(and_(ApiMetric.department == dept, ApiMetric.status != "SUCCESS"))
            ).first() or 0
            d_avg_lat = self.db.scalars(
                select(func.avg(ApiMetric.duration_ms)).where(ApiMetric.department == dept)
            ).first() or 0.0

            dept_stats[dept] = {
                "requests": d_reqs,
                "failures": d_fails,
                "average_latency_ms": round(float(d_avg_lat), 2)
            }

        return {
            "total_requests": total_reqs,
            "successful_requests": success_reqs,
            "failed_requests": failed_reqs,
            "failure_rate": failure_rate,
            "average_latency_ms": round(float(avg_latency), 2),
            "departments": dept_stats
        }

    def get_workflow_operational_counts(self) -> Dict[str, Any]:
        total = self.db.scalars(select(func.count(Application.id))).first() or 0
        
        status_counts = {}
        statuses = [
            "SUBMITTED", "VALIDATING", "CONSENT_CHECK", "IDENTITY_RESOLUTION",
            "REVENUE_VERIFICATION", "LAND_VERIFICATION", "WELFARE_VERIFICATION",
            "ELIGIBILITY_EVALUATION", "WAITING_FOR_DEPARTMENT", "MANUAL_REVIEW",
            "APPROVED", "REJECTED", "FAILED"
        ]

        for st in statuses:
            cnt = self.db.scalars(select(func.count(Application.id)).where(Application.status == st)).first() or 0
            status_counts[st] = cnt

        running = sum([status_counts[s] for s in ["SUBMITTED", "VALIDATING", "CONSENT_CHECK", "IDENTITY_RESOLUTION", "REVENUE_VERIFICATION", "LAND_VERIFICATION", "WELFARE_VERIFICATION", "ELIGIBILITY_EVALUATION"]])
        waiting = status_counts["WAITING_FOR_DEPARTMENT"]
        completed = status_counts["APPROVED"] + status_counts["REJECTED"]
        failed = status_counts["FAILED"]
        manual_review = status_counts["MANUAL_REVIEW"]

        return {
            "total": total,
            "running": running,
            "waiting": waiting,
            "completed": completed,
            "failed": failed,
            "manual_review": manual_review,
            "breakdown": status_counts
        }

    def get_waiting_workflows(self, page: int = 1, size: int = 20) -> Dict[str, Any]:
        query = select(Application).where(Application.status == ApplicationStatus.WAITING_FOR_DEPARTMENT).order_by(desc(Application.updated_at))
        
        total = self.db.scalars(select(func.count()).select_from(query.subquery())).first() or 0
        items_db = self.db.scalars(query.offset((page - 1) * size).limit(size)).all()

        now = utc_now()
        items = []
        for app in items_db:
            # SQLite returns timezone-naive datetimes even for TIMESTAMP WITH TIME ZONE columns.
            # Normalise to UTC before subtracting from the timezone-aware utc_now() to avoid
            # "can't subtract offset-naive and offset-aware datetimes" TypeError.
            updated_at = app.updated_at or app.created_at or now
            if updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)
            waiting_duration = round((now - updated_at).total_seconds() * 1000, 2)
            items.append({
                "application_id": str(app.id),
                "application_number": app.application_number,
                "department": "LAND",
                "status": app.status,
                "waiting_since": updated_at.isoformat(),
                "waiting_duration_ms": max(0.0, waiting_duration)
            })

        return {
            "total": total,
            "page": page,
            "size": size,
            "items": items
        }

    def get_sla_overview(self) -> Dict[str, Any]:
        total = self.db.scalars(select(func.count(SlaRecord.id))).first() or 0
        met = self.db.scalars(select(func.count(SlaRecord.id)).where(SlaRecord.status == SlaStatus.SLA_MET)).first() or 0
        breached = total - met
        breach_rate = round((breached / total * 100.0), 2) if total > 0 else 0.0

        avg_proc = self.db.scalars(select(func.avg(SlaRecord.duration_ms))).first() or 0.0

        return {
            "sla_total": total,
            "sla_met": met,
            "sla_breached": breached,
            "breach_rate": breach_rate,
            "average_processing_time_ms": round(float(avg_proc), 2)
        }

    def get_data_quality_overview(self) -> Dict[str, Any]:
        overall_avg = self.db.scalars(select(func.avg(DataQualityResult.overall_score))).first() or 100.0

        dept_scores = {}
        for dept in ["REVENUE", "LAND", "WELFARE"]:
            score = self.db.scalars(
                select(func.avg(DataQualityResult.overall_score)).where(DataQualityResult.department == dept)
            ).first() or 100.0
            dept_scores[dept] = round(float(score), 2)

        # Count total validation errors recorded
        all_results = self.db.scalars(select(DataQualityResult)).all()
        total_errors = sum([len(r.validation_errors) for r in all_results if r.validation_errors])

        return {
            "overall_score": round(float(overall_avg), 2),
            "departments": dept_scores,
            "validation_errors": total_errors
        }

    def get_application_timeline(self, application_id: uuid.UUID) -> Dict[str, Any]:
        app_obj = self.db.get(Application, application_id)
        if not app_obj:
            return None

        events = []

        # Application creation event
        events.append({
            "event": "APPLICATION_CREATED",
            "timestamp": app_obj.created_at.isoformat(),
            "application_id": str(app_obj.id),
            "trace_id": None
        })

        # Fetch Audit Logs for this application
        audits = self.db.scalars(
            select(AuditLog)
            .where(AuditLog.resource_id.in_([str(app_obj.id), app_obj.application_number]))
            .order_by(AuditLog.created_at.asc())
        ).all()

        for a in audits:
            events.append({
                "event": a.action,
                "timestamp": a.created_at.isoformat(),
                "department": a.department.code if a.department else None,
                "result": a.result,
                "trace_id": a.trace_id
            })

        # Fetch API metrics for this application
        metrics = self.db.scalars(
            select(ApiMetric)
            .where(ApiMetric.application_id == application_id)
            .order_by(ApiMetric.created_at.asc())
        ).all()

        for m in metrics:
            events.append({
                "event": f"{m.department}_{m.operation}_COMPLETED",
                "timestamp": m.completed_at.isoformat(),
                "department": m.department,
                "operation": m.operation,
                "status": m.status,
                "duration_ms": m.duration_ms,
                "trace_id": m.trace_id,
                "error_category": m.error_category
            })

        # Sort all events chronologically
        events.sort(key=lambda x: x["timestamp"])

        return {
            "application_id": str(app_obj.id),
            "application_number": app_obj.application_number,
            "workflow_status": app_obj.status,
            "events": events
        }

    def get_exceptions_log(self, page: int = 1, size: int = 20) -> Dict[str, Any]:
        query = select(ApiMetric).where(ApiMetric.status != "SUCCESS").order_by(desc(ApiMetric.created_at))
        
        total = self.db.scalars(select(func.count()).select_from(query.subquery())).first() or 0
        items_db = self.db.scalars(query.offset((page - 1) * size).limit(size)).all()

        items = []
        for m in items_db:
            items.append({
                "id": str(m.id),
                "application_id": str(m.application_id) if m.application_id else None,
                "department": m.department,
                "operation": m.operation,
                "http_status": m.http_status,
                "error_category": m.error_category or classify_error("Unknown", m.http_status),
                "timestamp": m.created_at.isoformat()
            })

        return {
            "total": total,
            "page": page,
            "size": size,
            "items": items
        }
