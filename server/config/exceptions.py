from rest_framework.exceptions import APIException


class AppException(APIException):
    status_code = 400
    default_code = "APP_ERROR"
    default_detail = "Something went wrong."


class UsernameTakenError(AppException):
    status_code = 409
    default_code = "USERNAME_TAKEN"
    default_detail = "This username is already taken."


class InvalidCredentialsError(AppException):
    status_code = 401
    default_code = "INVALID_CREDENTIALS"
    default_detail = "Invalid username or password."


class ResourceNotFoundError(AppException):
    status_code = 404
    default_code = "NOT_FOUND"
    default_detail = "The requested resource was not found."