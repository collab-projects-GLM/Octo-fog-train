from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def issue_tokens(user):
    refresh = RefreshToken.for_user(user)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    # Declared explicitly: the model field is unique, but ModelSerializer would
    # otherwise take `required` from the AbstractUser field definition.
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "avatar"]

    def validate_username(self, value):
        value = value.strip()

        # Login treats an identifier containing "@" as an email, so keep the two
        # namespaces apart.
        if "@" in value:
            raise serializers.ValidationError("Usernames cannot contain '@'.")

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with that username already exists."
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        # Done here rather than as a field validator so that the similarity
        # validator can compare the password against the username and email.
        candidate = User(
            username=attrs.get("username", ""),
            email=attrs.get("email", ""),
        )

        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        password = attrs["password"]

        user = (
            User.objects.filter(email__iexact=identifier).first()
            or User.objects.filter(username__iexact=identifier).first()
        )

        # Authenticate even when nobody matched: the backend then still hashes
        # the password, so response time doesn't reveal which accounts exist.
        user = authenticate(
            request=self.context.get("request"),
            username=user.get_username() if user else identifier,
            password=password,
        )

        if user is None:
            raise AuthenticationFailed("Invalid username/email or password.")

        attrs["user"] = user
        attrs["tokens"] = issue_tokens(user)

        return attrs
