from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.fields import get_error_detail
from rest_framework.validators import UniqueValidator

from config.exceptions import UsernameTakenError

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]
        # `validators` replaces the auto-generated list, which is how the
        # case-sensitive UniqueValidator is swapped for an iexact one that
        # matches the DB constraints. The username format check is restated.
        extra_kwargs = {
            "username": {
                "validators": [
                    UnicodeUsernameValidator(),
                    UniqueValidator(
                        queryset=User.objects.all(),
                        lookup="iexact",
                        message="A user with that username already exists.",
                    ),
                ]
            },
            "email": {
                "validators": [
                    UniqueValidator(
                        queryset=User.objects.all(),
                        lookup="iexact",
                        message="A user with that email already exists.",
                    ),
                ]
            },
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise UsernameTakenError()

        return value

    def validate(self, attrs):
        # Runs settings.AUTH_PASSWORD_VALIDATORS (common, numeric, similar to
        # username/email). Object-level so the other fields are available.
        user = User(username=attrs.get("username", ""), email=attrs.get("email", ""))
        try:
            validate_password(attrs["password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": get_error_detail(exc)})

        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)