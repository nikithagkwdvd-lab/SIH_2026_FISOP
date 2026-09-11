class ErrorCategory:
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    CONSENT_DENIED = "CONSENT_DENIED"
    IDENTITY_NOT_FOUND = "IDENTITY_NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    DATA_QUALITY_ERROR = "DATA_QUALITY_ERROR"
    TIMEOUT = "TIMEOUT"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    HTTP_ERROR = "HTTP_ERROR"
    WORKFLOW_ERROR = "WORKFLOW_ERROR"
    SLA_BREACH = "SLA_BREACH"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


def classify_error(exception_or_message: str, http_status: int = None) -> str:
    """
    Deterministically maps exceptions, status codes, and error detail strings to the standard operational error taxonomy.
    """
    msg = str(exception_or_message).upper()
    
    if http_status == 401 or "UNAUTHENTICATED" in msg or "UNAUTHORIZED" in msg or "EXPIRED" in msg:
        return ErrorCategory.AUTHENTICATION_ERROR
    if http_status == 403 or "ACCESS DENIED" in msg or "PERMISSION" in msg:
        if "CONSENT" in msg:
            return ErrorCategory.CONSENT_DENIED
        return ErrorCategory.AUTHORIZATION_ERROR
    if "CONSENT" in msg and ("DENIED" in msg or "REVOKED" in msg or "NOT FOUND" in msg):
        return ErrorCategory.CONSENT_DENIED
    if http_status == 404 or "IDENTITY" in msg or "NOT FOUND" in msg:
        return ErrorCategory.IDENTITY_NOT_FOUND
    if "QUALITY" in msg or "MISSING" in msg or "REQUIRED" in msg or "INVALID_FIELD" in msg:
        return ErrorCategory.DATA_QUALITY_ERROR
    if "TIMEOUT" in msg or "TIMED OUT" in msg or http_status == 504:
        return ErrorCategory.TIMEOUT
    if "UNAVAILABLE" in msg or "CONNECTION" in msg or http_status == 503:
        return ErrorCategory.SERVICE_UNAVAILABLE
    if "VALIDATION" in msg or http_status == 422:
        return ErrorCategory.VALIDATION_ERROR
    if "SLA" in msg or "BREACH" in msg:
        return ErrorCategory.SLA_BREACH
    if http_status and http_status >= 500:
        return ErrorCategory.HTTP_ERROR
        
    return ErrorCategory.UNKNOWN_ERROR
