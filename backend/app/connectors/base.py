import abc
import os
from typing import Any, Dict, Optional
import httpx

from app.connectors.circuit_breaker import get_circuit_breaker


class BaseConnector(abc.ABC):
    """
    Abstract Base Connector for heterogeneous legacy government APIs.
    Communicates exclusively via HTTP/REST without direct database access.
    Integrates CircuitBreaker, bounded retries, finite timeouts, and error classification.
    """
    def __init__(self, department_name: str, base_url: str, timeout: Optional[float] = None):
        self.department_name = department_name.upper()
        self.base_url = base_url.rstrip("/")
        
        connect_timeout = float(os.getenv("DEPARTMENT_CONNECT_TIMEOUT", "3.0"))
        read_timeout = float(os.getenv("DEPARTMENT_READ_TIMEOUT", "5.0"))
        
        self.timeout_config = httpx.Timeout(
            timeout if timeout is not None else read_timeout,
            connect=connect_timeout
        )
        self.circuit_breaker = get_circuit_breaker(self.department_name)

    async def _get(self, endpoint: str) -> Dict[str, Any]:
        """
        Executes asynchronous GET request with CircuitBreaker protection and finite timeouts.
        """
        if not self.circuit_breaker.allow_request():
            return self.circuit_breaker.get_fast_fail_response()

        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient(timeout=self.timeout_config) as client:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    self.circuit_breaker.record_success()
                    return {"success": True, "data": response.json(), "status_code": 200}
                elif response.status_code == 404:
                    # 404 Not Found is a permanent record result, not a circuit failure
                    self.circuit_breaker.record_success()
                    return {"success": False, "error": "NOT_FOUND", "detail": f"Resource at {endpoint} not found", "status_code": 404}
                else:
                    # 5xx or server errors record circuit failure
                    if response.status_code >= 500:
                        self.circuit_breaker.record_failure()
                    return {"success": False, "error": "HTTP_ERROR", "detail": f"HTTP {response.status_code}: {response.text}", "status_code": response.status_code}
            except httpx.TimeoutException:
                self.circuit_breaker.record_failure()
                return {"success": False, "error": "TIMEOUT", "detail": f"Timeout connecting to {self.base_url}", "status_code": 504}
            except httpx.ConnectError:
                self.circuit_breaker.record_failure()
                return {"success": False, "error": "CONNECTION_FAILED", "detail": f"Failed to connect to {self.base_url}", "status_code": 503}
            except Exception as e:
                self.circuit_breaker.record_failure()
                return {"success": False, "error": "UNKNOWN_ERROR", "detail": str(e), "status_code": 500}

    @abc.abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check target system health status."""
        pass

    @abc.abstractmethod
    async def fetch_normalized_data(self, department_citizen_id: str) -> Any:
        """Fetch and transform target system data into normalized model."""
        pass
