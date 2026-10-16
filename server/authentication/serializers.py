from django.contrib.auth import get_user_model
from rest_framework import serializers

from config.exceptions import UsernameTakenError

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise UsernameTakenError()

        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)