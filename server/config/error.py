from typing import Any, Literal, TypedDict


class ErrorDetail(TypedDict):
    field: str | None
    message: str
    code: str


class ErrorBody(TypedDict):
    code: str
    message: str
    details: list[ErrorDetail]


class ApiErrorResponse(TypedDict):
    status: Literal["error"]
    error: ErrorBody


class ApiSuccessResponse(TypedDict):
    status: Literal["ok"]
    data: Any
