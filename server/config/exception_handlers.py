import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler, set_rollback

from config.error import ApiErrorResponse, ErrorDetail

logger = logging.getLogger(__name__)


def _flatten(detail, field: str | None = None) -> list[ErrorDetail]:
    """Flatten DRF's nested error detail into a flat list of errors.

    {"email": ["Invalid."], "items": [{}, {"qty": ["Required."]}]} becomes
    [{"field": "email", ...}, {"field": "items.1.qty", ...}].
    """
    if isinstance(detail, dict):
        return [
            error
            for key, value in detail.items()
            for error in _flatten(value, f"{field}.{key}" if field else str(key))
        ]

    if isinstance(detail, (list, tuple)):
        return [
            error
            for index, value in enumerate(detail)
            for error in _flatten(
                value,
                # Only list items that are themselves nested need an index in the path.
                f"{field}.{index}" if field and isinstance(value, (dict, list)) else field,
            )
        ]

    return [
        {
            "field": field,
            "message": str(detail),
            "code": str(getattr(detail, "code", "invalid")).upper(),
        }
    ]


def _error_response(response: Response, code: str, message: str, details: list[ErrorDetail]):
    body: ApiErrorResponse = {
        "status": "error",
        "error": {"code": code, "message": message, "details": details},
    }
    response.data = body
    return response


def custom_exception_handler(exc, context):
    # Same conversions DRF applies internally, done up front so every
    # exception we format below is an APIException.
    if isinstance(exc, Http404):
        exc = exceptions.NotFound(*exc.args)
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied(*exc.args)

    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception", exc_info=exc)
        set_rollback()
        return _error_response(
            Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR),
            code="INTERNAL_ERROR",
            message="Internal server error.",
            details=[],
        )

    if isinstance(exc, exceptions.ValidationError):
        return _error_response(
            response,
            code="VALIDATION_ERROR",
            message="Validation failed.",
            details=_flatten(exc.detail),
        )

    return _error_response(
        response,
        code=str(exc.get_codes()).upper(),
        message=str(exc.detail),
        details=[],
    )
