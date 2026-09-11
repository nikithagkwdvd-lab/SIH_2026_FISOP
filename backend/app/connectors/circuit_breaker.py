import os
import time
from typing import Dict, Any, Optional


class CircuitState:
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """
    Lightweight, thread-safe, in-memory Circuit Breaker for legacy department connectors.
    Prevents repeated cascading failures when a target department microservice is offline or degraded.
    """
    def __init__(
        self,
        department_name: str,
        failure_threshold: Optional[int] = None,
        recovery_timeout_seconds: Optional[float] = None
    ):
        self.department_name = department_name.upper()
        self.failure_threshold = failure_threshold or int(os.getenv("CIRCUIT_FAILURE_THRESHOLD", "3"))
        self.recovery_timeout_seconds = recovery_timeout_seconds or float(os.getenv("CIRCUIT_RECOVERY_TIMEOUT_SECONDS", "10.0"))

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0

    def allow_request(self) -> bool:
        now = time.time()
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if now - self.last_failure_time >= self.recovery_timeout_seconds:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        if self.state == CircuitState.HALF_OPEN:
            return True
        return True

    def record_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def get_fast_fail_response(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error": "SERVICE_UNAVAILABLE",
            "detail": f"Circuit breaker is OPEN for department {self.department_name}. Failing fast without remote network call.",
            "status_code": 503
        }


# Global registry of department circuit breakers
circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(department_name: str) -> CircuitBreaker:
    dept = department_name.upper()
    if dept not in circuit_breakers:
        circuit_breakers[dept] = CircuitBreaker(dept)
    return circuit_breakers[dept]
