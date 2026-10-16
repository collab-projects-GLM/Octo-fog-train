from rest_framework import status
from rest_framework.renderers import JSONRenderer

from config.error import ApiSuccessResponse


class EnvelopeJSONRenderer(JSONRenderer):
    """Wrap every successful response as {"status": "ok", "data": ...}.

    Error responses (4xx/5xx) are already shaped by
    config.exception_handlers.custom_exception_handler, so they pass through.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")

        if (
            response is not None
            and response.status_code < status.HTTP_400_BAD_REQUEST
            and response.status_code != status.HTTP_204_NO_CONTENT
        ):
            body: ApiSuccessResponse = {
                "status": "ok",
                "data": {} if data is None else data,
            }
            data = body

        return super().render(data, accepted_media_type, renderer_context)
